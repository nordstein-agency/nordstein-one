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
      <Navbar />
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
