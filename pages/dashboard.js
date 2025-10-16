import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Prüfen, ob Benutzer eingeloggt ist
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/')  // nicht eingeloggt → zurück zur Login-Seite
      else setUser(session.user)
    })

    // Kunden abrufen
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('*')
      setCustomers(data)
    }
    fetchCustomers()
  }, [])

  if (!user) return <p>Loading...</p>

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <h2>Willkommen, {user.email}</h2>

      <h3>Kundenliste</h3>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name} ({c.type}) – {c.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
