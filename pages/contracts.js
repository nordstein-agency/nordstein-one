

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'


const handleDownload = async (pdfUrl, title = 'vertrag') => {
  try {
    if (!pdfUrl) {
      alert('Kein PDF für diesen Vertrag hinterlegt.')
      return
    }

    // Prüfen, ob es sich um eine vollständige URL handelt
    if (pdfUrl.startsWith('http')) {
      // Direktes Herunterladen der Datei
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error('Fehler beim Abrufen der PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return
    }

    // Wenn kein http-Link, dann ist es ein Pfad im Storage-Bucket
    const { data, error } = await supabase.storage.from('contracts').download(pdfUrl)
    if (error) throw error

    const url = window.URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${title}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Fehler beim Herunterladen der PDF:', err)
    alert('Fehler beim Herunterladen der PDF.')
  }
}






export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customUserFilter, setCustomUserFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)
  const [team, setTeam] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [provision, setProvision] = useState('') // Für Detailansicht
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  // 1️⃣ Auth-User -> CustomUser
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        console.log('Kein eingeloggter User')
        setLoading(false)
        return
      }

      const { data: customData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (error) {
        console.error('Fehler beim Laden des Custom Users:', error)
        setLoading(false)
        return
      }

      setCustomUser(customData)
      setLoading(false)

      // Team laden für Dropdown + Filter
      const teamData = await fetchTeamForDropdown(customData.id)
      setTeam(teamData)
    }
    init()
  }, [])

  // 2️⃣ Verträge laden
  useEffect(() => {
    if (!customUser) return
    fetchAllContracts(customUser.id)
  }, [customUser])

  // 3️⃣ Filter anwenden
  useEffect(() => {
    applyClientFilters()
  }, [contracts, search, statusFilter, customUserFilter, currentPage])


  const fetchAllContracts = async (userId) => {
  setLoading(true)
  try {
    const teamMembers = await fetchTeamForDropdown(userId)
    const teamIds = teamMembers.map(u => u.id)

    // Verträge laden
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .in('user_id', teamIds)
      .order('created_at', { ascending: false })
    if (contractsError) throw contractsError

    // Kunden laden
    const customerIds = [...new Set(contractsData.map(c => c.customer_id))]
    const { data: customersData } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds)

    // Kunde zu jedem Vertrag hinzufügen
    const contractsWithCustomer = contractsData.map(c => ({
      ...c,
      customer: customersData.find(cu => cu.id === c.customer_id)
    }))

    setContracts(contractsWithCustomer)
    setTotalPages(Math.ceil(contractsWithCustomer.length / pageSize))
  } catch (err) {
    console.error(err)
    setContracts([])
  } finally {
    setLoading(false)
  }
}





  const applyClientFilters = () => {
    if (!contracts) {
      setFiltered([])
      return
    }

    const s = (search || '').toString().trim().toLowerCase()
    const st = (statusFilter || '').toString().trim().toLowerCase()

    const out = contracts.filter((c) => {
      const customerName = (c.customer?.name || '').toLowerCase()
      if (s && !customerName.includes(s)) return false

      const statusVal = (c.state || '').toString().trim().toLowerCase()
      if (st && statusVal !== st) return false

      if (customUserFilter && c.user_id !== customUserFilter) return false

      return true
    })

    const start = (currentPage - 1) * pageSize
    const paginated = out.slice(start, start + pageSize)
    setFiltered(paginated)
    setTotalPages(Math.ceil(out.length / pageSize))
  }

  const fetchTeamForDropdown = async (currentUserId) => {
    let allPartners = []

    const fetchLevel = async (ids) => {
      if (!ids || ids.length === 0) return
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('leader', ids)
        .order('first_name', { ascending: true })
      if (error) {
        console.error('Fehler beim Laden des Teams:', error)
        return
      }
      if (data && data.length > 0) {
        allPartners.push(...data)
        const nextLevelIds = data.map((p) => p.id)
        await fetchLevel(nextLevelIds)
      }
    }

    await fetchLevel([currentUserId])

    const { data: selfData, error: selfError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', currentUserId)
      .single()
    if (selfError) console.error('Fehler beim Laden des eigenen Users:', selfError)
    else if (selfData) allPartners.unshift(selfData)

    return allPartners
  }

  const selectContract = async (contract) => {
    setSelectedContract(contract)
    setProvision('') // Anfangs leer, später Provision-Datum eintragen
  }

  const renderPagination = () => {
    let pages = []
    if (currentPage > 1) pages.push(<button key="<-" onClick={() => setCurrentPage(currentPage - 1)}>{"<-"}</button>)
    if (currentPage < totalPages) pages.push(<button key="->" onClick={() => setCurrentPage(currentPage + 1)}>{"->"}</button>)
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{ fontWeight: currentPage === i ? 'bold' : 'normal' }}
        >
          {i}
        </button>
      )
    }
    return pages
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Verträge / Anträge</h1>

      {/* Suche + Filter */}
      <div className="flex gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-1/3 text-[#451a3d] placeholder-[#aaa]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-4 py-2 text-[#451a3d]"
        >
          <option value="">Alle Status</option>
          <option value="eingereicht">Eingereicht</option>
          <option value="antrag">Antrag</option>
          <option value="bezahlt">Bezahlt</option>
        </select>
        <select
          value={customUserFilter}
          onChange={(e) => setCustomUserFilter(e.target.value)}
          className="border rounded px-4 py-2 text-[#451a3d]"
        >
          <option value="">Alle Betreuer</option>
          {team.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabelle */}
      {loading ? (
        <div>Lädt...</div>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Kunde</th>
              <th className="text-left p-3">Tarif</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Einheiten</th>
              <th className="text-left p-3">Betreuer</th>
              <th className="text-left p-3">Eingereicht am</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const leader = team.find(u => u.id === c.user_id)
              return (
                <tr
                  key={c.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectContract(c)}
                >
                  <td className="p-3">{c.customer?.name || '-'}</td>
                  <td className="p-3">{c.tarif}</td>
                  <td className="p-3">{c.state}</td>
                  <td className="p-3">{c.eh}</td>
                  <td className="p-3">{leader ? `${leader.first_name} ${leader.last_name}` : '-'}</td>
                  <td className="p-3">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="mt-4 flex gap-2">{renderPagination()}</div>

      {/* Detailansicht */}
      {selectedContract && (
        <div className="bg-white rounded shadow mt-8 p-6 relative">
          <h1 className="nav-link mb-4 text-xl font-bold" style={{ color: '#451a3d' }}>VERTRAG</h1>

          {/* Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setSelectedContract(null)}
              className="border px-3 py-1 rounded"
            >
              Schließen
            </button>


            <button
              onClick={() => console.log('Einreichen')}
              className="border px-3 py-1 rounded"
            >
              Einreichen
            </button>


            <button
              onClick={() =>
              handleDownload(selectedContract.pdf_url, selectedContract.customer?.name || 'vertrag')
              }
              className="border px-3 py-1 rounded"
            >
              Download
            </button>



          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-8 mb-6">
            <div>
              <p style={{ color: '#451a3d' }}><strong>Kunde:</strong> {selectedContract.customer?.name || '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Tarif:</strong> {selectedContract.tarif}</p>
              <p style={{ color: '#451a3d' }}><strong>Status:</strong> {selectedContract.state}</p>
              <p style={{ color: '#451a3d' }}><strong>Einheiten:</strong> {selectedContract.eh}</p>
              <p style={{ color: '#451a3d' }}><strong>Betreuer:</strong> {team.find(u => u.id === selectedContract.user_id) ? `${team.find(u => u.id === selectedContract.user_id).first_name} ${team.find(u => u.id === selectedContract.user_id).last_name}` : '-'}</p>
            </div>
            <div>
              <p style={{ color: '#451a3d' }}><strong>Eingereicht am:</strong> {selectedContract.sent_at ? new Date(selectedContract.sent_at).toLocaleDateString() : '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Provision:</strong> {provision || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

