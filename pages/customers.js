/*

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

export default function Customers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session.user.id)

      setCustomers(data || [])
    }

    fetchCustomers()
  }, [])

  return (
    <>

      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Kunden</h1>
        {customers.map(c => (
          <div key={c.id} className="border p-2 rounded mb-2">
            <p>Name: {c.name}</p>
            <p>Firma/Person: {c.type}</p>
            <p>Email: {c.email}</p>
            <p>Telefon: {c.phone}</p>
            <p>Status: {c.status}</p>
          </div>
        ))}
      </div>
    </>
  )
}

*/

/*

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (user) fetchCustomers()
  }, [user, search, statusFilter])

  const fetchCustomers = async () => {
    setLoading(true)
    let query = supabase
      .from('customers')
      .select(`
        id,
        type,
        name,
        ceo,
        adress,
        status,
        users:user_id(name)
      `)
      .eq('user_id', user.id)

    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error } = await query.order('name', { ascending: true })
    if (error) console.log(error)
    else setCustomers(data)
    setLoading(false)
  }

  const getLocation = (adress) => {
    if (!adress) return ''
    // Annahme: Adresse hat "PLZ Ort, Straße"
    const parts = adress.split(',')
    return parts[0] // nur "PLZ Ort"
  }

 

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Kunden</h1>

      
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-1/2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option value="">Alle Status</option>
          <option value="Lead">Lead</option>
          <option value="Kontaktiert">Kontaktiert</option>
          <option value="Terminiert">Terminiert</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      
      {loading ? (
        <p>Lädt...</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Betreuer</th>
              <th className="text-left p-3">Ort</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{c.type === 'Firma' ? c.ceo : c.name}</td>
                <td className="p-3">{c.users?.name || '-'}</td>
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

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)

  // 1) Auth-User -> CustomUser
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

  // 2) Wenn customUser vorhanden -> lade Kunden
  useEffect(() => {
    if (!customUser) return
    fetchAllCustomers(customUser.id)
  }, [customUser])

  // 3) Wenn search oder statusFilter sich ändert -> client-side filtern
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

      {/* Suche + Filter */}
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

      {/* Tabelle */}
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
