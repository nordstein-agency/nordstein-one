import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

export default function Contracts() {
  const [contracts, setContracts] = useState([])

  useEffect(() => {
    const fetchContracts = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', session.user.id)

      setContracts(data || [])
    }

    fetchContracts()
  }, [])

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Verträge</h1>
        {contracts.map(c => (
          <div key={c.id} className="border p-2 rounded mb-2">
            <p>Kunde: {c.customer_name}</p>
            <p>Einheiten: {c.units}</p>
            <p>Datum: {c.date}</p>
          </div>
        ))}
      </div>
    </>
  )
}
