
/*

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)

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
    }
    init()
  }, [])

  useEffect(() => {
    if (!customUser) return
    fetchAllCustomers(customUser.id)
  }, [customUser])

  useEffect(() => {
    applyClientFilters()
  }, [customers, search, statusFilter])

  const fetchAllCustomers = async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, type, name, ceo, adress, status, user_id')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Fehler beim Laden der Kunden:', error)
        setCustomers([])
      } else {
        console.log('Rohdaten Kunden (DB):', data)
        setCustomers(data || [])
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
      const nameVal = (c.type === 'Firma' ? c.ceo : c.name) || ''
      const nameLower = nameVal.toString().toLowerCase()

      if (s && !nameLower.includes(s)) return false

      const statusVal = (c.status || '').toString().trim().toLowerCase()
      if (st && statusVal !== st) return false

      return true
    })

    setFiltered(out)
  }

  const getLocation = (adress) => {
    if (!adress) return ''
    const parts = adress.split(',')
    return parts[0]
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6 text-[#451a3d]">Kunden</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-1/2 text-[#451a3d] placeholder-[#451a3d]/70"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-4 py-2 text-[#451a3d]"
        >
          <option value="">Alle Status</option>
          <option value="Lead">Lead</option>
          <option value="Kontaktiert">Kontaktiert</option>
          <option value="Terminiert">Terminiert</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[#451a3d]">Lädt...</p>
      ) : (!filtered || filtered.length === 0) ? (
        <p className="text-[#451a3d]">Keine Kunden gefunden.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow text-[#451a3d]">
          <thead>
            <tr className="bg-gray-100 text-[#451a3d]">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Ort</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 text-[#451a3d]">
                <td className="p-3">{c.type === 'Firma' ? c.ceo : c.name}</td>
                <td className="p-3">{getLocation(c.adress)}</td>
                <td className="p-3 font-semibold">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


*/

/*


import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    type: 'Privat',
    name: '',
    ceo: '',
    adress: '',
    status: 'Lead'
  })

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
    }
    init()
  }, [])

  useEffect(() => {
    if (!customUser) return
    fetchAllCustomers(customUser.id)
  }, [customUser])

  useEffect(() => {
    applyClientFilters()
  }, [customers, search, statusFilter])

  const fetchAllCustomers = async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, type, name, ceo, adress, status, user_id')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Fehler beim Laden der Kunden:', error)
        setCustomers([])
      } else {
        console.log('Rohdaten Kunden (DB):', data)
        setCustomers(data || [])
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
      const nameVal = (c.type === 'Firma' ? c.ceo : c.name) || ''
      const nameLower = nameVal.toString().toLowerCase()

      if (s && !nameLower.includes(s)) return false

      const statusVal = (c.status || '').toString().trim().toLowerCase()
      if (st && statusVal !== st) return false

      return true
    })

    setFiltered(out)
  }

  const getLocation = (adress) => {
    if (!adress) return ''
    const parts = adress.split(',')
    return parts[0]
  }

  const handleSaveCustomer = async () => {
    if (!customUser) return alert('Kein Benutzer geladen.')
    if (!newCustomer.name && !newCustomer.ceo)
      return alert('Bitte Name oder CEO angeben.')

    const insertData = {
      ...newCustomer,
      user_id: customUser.id,
      created_at: new Date()
    }

    const { error } = await supabase.from('customers').insert([insertData])

    if (error) {
      console.error('Fehler beim Speichern des Kunden:', error)
      alert('Fehler beim Speichern.')
    } else {
      setShowModal(false)
      setNewCustomer({
        type: 'Privat',
        name: '',
        ceo: '',
        adress: '',
        status: 'Lead'
      })
      fetchAllCustomers(customUser.id)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6 text-[#451a3d]">Kunden</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 w-3/4">
          <input
            type="text"
            placeholder="Kunden suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-4 py-2 w-1/2 text-[#451a3d] placeholder-[#451a3d]/70"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-4 py-2 text-[#451a3d]"
          >
            <option value="">Alle Status</option>
            <option value="Lead">Lead</option>
            <option value="Kontaktiert">Kontaktiert</option>
            <option value="Terminiert">Terminiert</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#451a3d] text-white font-semibold px-6 py-2 rounded-md hover:bg-[#5a2251] transition-colors"
        >
          Neue Kundenbeziehung
        </button>
      </div>

      {loading ? (
        <p className="text-[#451a3d]">Lädt...</p>
      ) : !filtered || filtered.length === 0 ? (
        <p className="text-[#451a3d]">Keine Kunden gefunden.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow text-[#451a3d]">
          <thead>
            <tr className="bg-gray-100 text-[#451a3d]">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Ort</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 text-[#451a3d]">
                <td className="p-3">{c.type === 'Firma' ? c.ceo : c.name}</td>
                <td className="p-3">{getLocation(c.adress)}</td>
                <td className="p-3 font-semibold">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-[#451a3d]">
            <h2 className="text-xl font-semibold mb-4">Neue Kundenbeziehung</h2>

            <div className="flex flex-col gap-3">
              <select
                value={newCustomer.type}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, type: e.target.value })
                }
                className="border rounded px-3 py-2"
              >
                <option value="Privat">Privatkunde</option>
                <option value="Firma">Firma</option>
              </select>

              {newCustomer.type === 'Firma' ? (
                <input
                  type="text"
                  placeholder="CEO / Ansprechpartner"
                  value={newCustomer.ceo}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, ceo: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              )}

              <input
                type="text"
                placeholder="Adresse"
                value={newCustomer.adress}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, adress: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <select
                value={newCustomer.status}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, status: e.target.value })
                }
                className="border rounded px-3 py-2"
              >
                <option value="Lead">Lead</option>
                <option value="Kontaktiert">Kontaktiert</option>
                <option value="Terminiert">Terminiert</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="border border-[#451a3d] text-[#451a3d] px-5 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCustomer}
                className="bg-[#451a3d] text-white px-5 py-2 rounded-md hover:bg-[#5a2251] transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


*/


import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  // Modal für neuen Kunden
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

      // Team laden für Dropdown und Kunden
      const teamData = await fetchTeamRecursive(customData.id)
      setTeam(teamData)

      // Kunden laden für alle Team-Mitglieder inkl. sich selbst
      fetchAllCustomers(teamData.map((u) => u.id))
    }
    init()
  }, [])

  // 3️⃣ Filter anwenden
  useEffect(() => {
    applyClientFilters()
  }, [customers, search, statusFilter, currentPage])

  // 🔹 Kunden laden für mehrere user_ids
  const fetchAllCustomers = async (userIds) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .in('user_id', userIds)
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

      return true
    })

    // Pagination
    const start = (currentPage - 1) * pageSize
    const paginated = out.slice(start, start + pageSize)
    setFiltered(paginated)
    setTotalPages(Math.ceil(out.length / pageSize))
  }

  const getLocation = (adress) => {
    if (!adress) return ''
    const parts = adress.split(',')
    return parts[0]
  }

  // 🔹 Team & Mitarbeiter rekursiv laden (inklusive sich selbst)
  const fetchTeamRecursive = async (currentUserId) => {
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

    // sich selbst hinzufügen
    const { data: selfData, error: selfError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', currentUserId)
      .single()
    if (selfError) console.error('Fehler beim Laden des eigenen Users:', selfError)
    else if (selfData) allPartners.unshift(selfData)

    return allPartners
  }

  // 🔹 Kunden speichern
  const saveCustomer = async () => {
    if (!newCustomer.name || !newCustomer.type || !newCustomer.status || !newCustomer.user_id) {
      alert('Bitte alle Pflichtfelder ausfüllen')
      return
    }

    setLoading(true)
    try {
      // Kunde speichern
      const { data: customerData, error: customerError } = await supabase
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

      if (customerError) throw customerError

      // Notiz speichern
      if (newCustomer.note) {
        const { error: noteError } = await supabase
          .from('customer_notes')
          .insert([{
            customer_id: customerData.id,
            note: newCustomer.note
          }])
        if (noteError) throw noteError
      }

      // Refresh
      fetchAllCustomers(team.map((u) => u.id))
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
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
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

  return (
      <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
        <h1 className="text-2xl font-bold mb-6">Kunden</h1>

        {/* Suche + Filter + Button */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Kunden suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-4 py-2 w-1/2 text-[#451a3d] placeholder-[#aaa]"
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
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#451a3d] text-white px-4 py-2 rounded"
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
                <tr key={c.id} className="border-t hover:bg-gray-50">
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

        {/* Modal: Neue Kundenbeziehung */}
        {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50">
    <div className="bg-white rounded shadow w-full max-w-xl max-h-[90vh] flex flex-col">
      
      {/* Header mit Abbrechen-Button */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Neue Kundenbeziehung</h2>
        <button
          onClick={() => setShowModal(false)}
          className="text-gray-500 hover:text-gray-800 font-bold"
        >
          ✕
        </button>
      </div>

      {/* Scrollbarer Inhalt */}
      <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
        {/* Zukünftiger Betreuer */}
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

        {/* Name */}
        <label>Name*</label>
        <input
          type="text"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="border px-2 py-1"
        />

        {/* Type */}
        <label>Type*</label>
        <select
          value={newCustomer.type}
          onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
          className="border px-2 py-1"
        >
          <option value="person">Person</option>
          <option value="company">Company</option>
        </select>

        {/* Adresse */}
        <label>Adresse</label>
        <input
          type="text"
          value={newCustomer.adress}
          onChange={(e) => setNewCustomer({ ...newCustomer, adress: e.target.value })}
          className="border px-2 py-1"
        />

        {/* Email */}
        <label>Email</label>
        <input
          type="email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          className="border px-2 py-1"
        />

        {/* Telefon */}
        <label>Telefon</label>
        <input
          type="text"
          value={newCustomer.phone}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          className="border px-2 py-1"
        />

        {/* CEO nur bei Company */}
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

        {/* Status */}
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

        {/* Kontaktperson */}
        <label>Kontaktperson</label>
        <input
          type="text"
          value={newCustomer.contact_person}
          onChange={(e) => setNewCustomer({ ...newCustomer, contact_person: e.target.value })}
          className="border px-2 py-1"
        />

        {/* Website */}
        <label>Website</label>
        <input
          type="text"
          value={newCustomer.website}
          onChange={(e) => setNewCustomer({ ...newCustomer, website: e.target.value })}
          className="border px-2 py-1"
        />

        {/* Notiz */}
        <label>Notiz</label>
        <textarea
  value={newCustomer.note}
  onChange={(e) => setNewCustomer({ ...newCustomer, note: e.target.value })}
  className="border px-2 py-1"
  rows={4} // Startgröße: 4 Zeilen
  style={{ minHeight: '4rem', maxHeight: 'auto', resize: 'vertical' }} // minHeight sorgt dafür, dass es nicht kleiner wird, resize erlaubt nur vertikal
/>
      </div>

      {/* Footer Buttons außerhalb des Scrollbereichs */}
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

      </div>
  )
}
