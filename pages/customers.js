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

      {/* Suche + Filter */}
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

      {/* Tabelle */}
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
