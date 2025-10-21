



import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'
      



export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customUserFilter, setCustomUserFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)
  const router = useRouter()


  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  // Modal für neuen Kunden / Bearbeiten
  const [showModal, setShowModal] = useState(false)

  // Neue Kundenfelder
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    type: 'person',
    adress: '',
    email: '',
    phone: '',
    ceo: '',
    contact_person: '',
    website: '',
    status: 'lead',
    user_id: '', // Betreuer
    note: ''
  })

  const [team, setTeam] = useState([])

  // Für Kunden-Detailansicht
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerNotes, setCustomerNotes] = useState([])

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

  // 2️⃣ Kunden laden
  useEffect(() => {
    if (!customUser) return
    fetchAllCustomers(customUser.id)
  }, [customUser])

  // 3️⃣ Filter anwenden
  useEffect(() => {
    applyClientFilters()
  }, [customers, search, statusFilter, customUserFilter, currentPage])

  const fetchAllCustomers = async (userId) => {
    setLoading(true)
    try {
      const teamMembers = await fetchTeamForDropdown(userId)
      const teamIds = teamMembers.map(u => u.id)

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .in('user_id', teamIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der Kunden:', error)
        setCustomers([])
      } else {
        setCustomers(data || [])
        setTotalPages(Math.ceil((data?.length || 0) / pageSize))
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Laden der Kunden:', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const applyClientFilters = () => {
    if (!customers) {
      setFiltered([])
      return
    }

    const s = (search || '').toString().trim().toLowerCase()
    const st = (statusFilter || '').toString().trim().toLowerCase()

    const out = customers.filter((c) => {
      const nameVal = (c.type === 'company' ? c.ceo : c.name) || ''
      const nameLower = nameVal.toString().toLowerCase()

      if (s && !nameLower.includes(s)) return false
      const statusVal = (c.status || '').toString().trim().toLowerCase()
      if (st && statusVal !== st) return false
      if (customUserFilter && c.user_id !== customUserFilter) return false

      return true
    })

    // Pagination
    const start = (currentPage - 1) * pageSize
    const paginated = out.slice(start, start + pageSize)
    setFiltered(paginated)
    setTotalPages(Math.ceil(out.length / pageSize))
  }

  // 🔹 Team Dropdown laden (inklusive dich selbst)
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

  // 🔹 Kunden speichern (Insert oder Update)
const saveCustomer = async () => {
  if (!newCustomer.name || !newCustomer.type || !newCustomer.status || !newCustomer.user_id) {
    alert('Bitte alle Pflichtfelder ausfüllen')
    return
  }

  setLoading(true)
  try {
    let customerData

    // ✅ Wenn ein Kunde ausgewählt ist → Update
    if (selectedCustomer && selectedCustomer.id) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: newCustomer.name,
          type: newCustomer.type,
          adress: newCustomer.adress,
          email: newCustomer.email,
          phone: newCustomer.phone,
          ceo: newCustomer.ceo,
          contact_person: newCustomer.contact_person,
          website: newCustomer.website,
          status: newCustomer.status,
          user_id: newCustomer.user_id
        })
        .eq('id', selectedCustomer.id)
        .select()
        .single()
      if (error) throw error
      customerData = data

      // 🔹 Notizen updaten
      if (newCustomer.note) {
        const { data: existingNotes } = await supabase
          .from('customer_notes')
          .select('*')
          .eq('customer_id', selectedCustomer.id)

        if (existingNotes?.length > 0) {
          await supabase
            .from('customer_notes')
            .update({ note: newCustomer.note })
            .eq('id', existingNotes[0].id)
        } else {
          await supabase
            .from('customer_notes')
            .insert([{ customer_id: selectedCustomer.id, note: newCustomer.note }])
        }
      }

    } else {
      // ✅ Neuer Kunde (Insert)
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomer.name,
          type: newCustomer.type,
          adress: newCustomer.adress,
          email: newCustomer.email,
          phone: newCustomer.phone,
          ceo: newCustomer.ceo,
          contact_person: newCustomer.contact_person,
          website: newCustomer.website,
          status: newCustomer.status,
          user_id: newCustomer.user_id
        }])
        .select()
        .single()
      if (error) throw error
      customerData = data

      // 🔹 Notiz speichern (wenn vorhanden)
      if (newCustomer.note) {
        await supabase
          .from('customer_notes')
          .insert([{ customer_id: customerData.id, note: newCustomer.note }])
      }

      // 🚀 Google Drive Ordner für neuen Kunden erstellen
      try {
        console.log("🚀 Erstelle Google Drive Ordner für Kunden:", customerData.name)
        await fetch('/api/create-customer-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customerData.id }),
        })
        console.log('✅ Google Drive Kundenordner erstellt.')
      } catch (driveErr) {
        console.error('❌ Fehler beim Erstellen des Drive-Ordners:', driveErr)
      }
    }

    // 🔄 Refresh & Cleanup
    fetchAllCustomers(customUser.id)
    setShowModal(false)
    setNewCustomer({
      name: '',
      type: 'person',
      adress: '',
      email: '',
      phone: '',
      ceo: '',
      contact_person: '',
      website: '',
      status: 'lead',
      user_id: '',
      note: ''
    })
    setSelectedCustomer(null)
  } catch (err) {
    console.error('Fehler beim Speichern:', err)
    alert('Fehler beim Speichern')
  } finally {
    setLoading(false)
  }
}


  // 🔹 Kunden auswählen & Notizen laden
  const selectCustomer = async (customer) => {
    setSelectedCustomer(null)
    setSelectedCustomer(customer)
    const { data: notes, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: true })
    if (error) console.error('Fehler beim Laden der Notizen:', error)
    else setCustomerNotes(notes)
  }

  // 🔹 Pagination Buttons generieren
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

  // 🔹 Modal für Bearbeiten vorbereiten
  const openEditModal = (customer) => {
    setNewCustomer({
      name: customer.name,
      type: customer.type,
      adress: customer.adress,
      email: customer.email,
      phone: customer.phone,
      ceo: customer.ceo,
      contact_person: customer.contact_person,
      website: customer.website,
      status: customer.status,
      user_id: customer.user_id,
      note: customerNotes[0]?.note || ''
    })
    setShowModal(true)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Kunden</h1>

      {/* Suche + Filter + Button */}
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
          <option value="lead">Lead</option>
          <option value="contacted">Contacted</option>
          <option value="dated">Dated</option>
          <option value="closed">Closed</option>
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

        <button
          onClick={() => { setSelectedCustomer(null); setShowModal(true); }}
          className="border rounded px-4 py-2 text-[#451a3d] bg-white hover:bg-gray-100"
        >
          Neue Kundenbeziehung
        </button>
      </div>

      {/* Kunden-Tabelle */}
      {loading ? (
        <div>Lädt...</div>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Adresse</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Telefon</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => selectCustomer(c)}
              >
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.type}</td>
                <td className="p-3">{c.adress}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="mt-4 flex gap-2">{renderPagination()}</div>

      {/* Modal: Neue Kundenbeziehung / Bearbeiten */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50">
          <div className="bg-white rounded shadow w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">{selectedCustomer ? 'Kunde bearbeiten' : 'Neue Kundenbeziehung'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
              <label>Zukünftiger Betreuer*</label>
              <select
                value={newCustomer.user_id}
                onChange={(e) => setNewCustomer({ ...newCustomer, user_id: e.target.value })}
                className="border px-2 py-1"
              >
                <option value="">Bitte wählen</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>

              <label>Name*</label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="border px-2 py-1"
              />

              <label>Type*</label>
              <select
                value={newCustomer.type}
                onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                className="border px-2 py-1"
              >
                <option value="person">Person</option>
                <option value="company">Company</option>
              </select>

              <label>Adresse</label>
              <input
                type="text"
                value={newCustomer.adress}
                onChange={(e) => setNewCustomer({ ...newCustomer, adress: e.target.value })}
                className="border px-2 py-1"
              />

              <label>Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="border px-2 py-1"
              />

              <label>Telefon</label>
              <input
                type="text"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="border px-2 py-1"
              />

              {newCustomer.type === 'company' && (
                <>
                  <label>CEO</label>
                  <input
                    type="text"
                    value={newCustomer.ceo}
                    onChange={(e) => setNewCustomer({ ...newCustomer, ceo: e.target.value })}
                    className="border px-2 py-1"
                  />
                </>
              )}

              <label>Status*</label>
              <select
                value={newCustomer.status}
                onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
                className="border px-2 py-1"
              >
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="dated">Dated</option>
                <option value="closed">Closed</option>
              </select>

              <label>Kontaktperson</label>
              <input
                type="text"
                value={newCustomer.contact_person}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact_person: e.target.value })}
                className="border px-2 py-1"
              />

              <label>Website</label>
              <input
                type="text"
                value={newCustomer.website}
                onChange={(e) => setNewCustomer({ ...newCustomer, website: e.target.value })}
                className="border px-2 py-1"
              />

              <label>Notiz</label>
              <textarea
                value={newCustomer.note}
                onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
                className="border px-2 py-1"
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded"
              >
                Abbrechen
              </button>
              <button
                onClick={saveCustomer}
                className="bg-[#451a3d] text-white px-4 py-2 rounded"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kunden-Detailansicht */}
{selectedCustomer && (
  <div className="bg-white rounded shadow mt-8 p-6 relative">
    <h1 className="nav-link mb-4 text-xl font-bold" style={{ color: '#451a3d' }}>KUNDE</h1>

    {/* Buttons oben rechts */}
    <div className="absolute top-4 right-4 flex gap-2">
      <button
        onClick={() => setSelectedCustomer(null)}
        className="border px-3 py-1 rounded"
      >
        Schließen
      </button>
      <button
        onClick={() => {
          setShowModal(true)
          setNewCustomer({
            ...selectedCustomer,
            user_id: selectedCustomer.user_id,
            note: customerNotes.map(n => n.note).join('\n')
          })
        }}
        className="border px-3 py-1 rounded"
      >
        Bearbeiten
      </button>


      

      <button
        onClick={() => router.push(`/create-concept?customerId=${selectedCustomer.id}`)}
        className="border px-3 py-1 rounded"
      >
        Konzept erstellen
      </button>



    </div>

    {/* Betreuer ermitteln */}
    {team.length > 0 && (
      (() => {
        const selectedCustomerLeader = team.find(u => u.id === selectedCustomer.user_id)
        return (
          <div className="grid grid-cols-3 gap-8 mb-6">
            <div>
              <p style={{ color: '#451a3d' }}><strong>Name:</strong> {selectedCustomer.name}</p>
              <p style={{ color: '#451a3d' }}><strong>Typ:</strong> {selectedCustomer.type}</p>
              <p style={{ color: '#451a3d' }}><strong>Adresse:</strong> {selectedCustomer.adress || '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Status:</strong> {selectedCustomer.status}</p>
              <p style={{ color: '#451a3d' }}><strong>Betreuer:</strong> {selectedCustomerLeader ? `${selectedCustomerLeader.first_name} ${selectedCustomerLeader.last_name}` : '-'}</p>
            </div>
            <div>
              <p style={{ color: '#451a3d' }}><strong>Email:</strong> {selectedCustomer.email || '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Telefon:</strong> {selectedCustomer.phone || '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Kontaktperson:</strong> {selectedCustomer.contact_person || '-'}</p>
              <p style={{ color: '#451a3d' }}><strong>Website:</strong> {selectedCustomer.website || '-'}</p>
            </div>
            <div>
              <p style={{ color: '#451a3d' }}><strong>CEO:</strong> {selectedCustomer.ceo || '-'}</p>
            </div>
          </div>
        )
      })()
    )}

    {/* Notizen */}
    <div>
      <h2 className="font-bold mb-2" style={{ color: '#451a3d' }}>Notizen</h2>
      <div className="flex flex-col gap-2">
        {customerNotes.length === 0 ? (
          <p style={{ color: '#451a3d' }}>Keine Notizen vorhanden</p>
        ) : (
          customerNotes.map((n) => (
            <div key={n.id} className="border p-2 rounded" style={{ color: '#451a3d' }}>
              {n.note}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}



    </div>
  )
}
