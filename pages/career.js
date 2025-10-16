import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

export default function Career() {
  const [team, setTeam] = useState([])

  useEffect(() => {
    const fetchTeam = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', session.user.id)

      setTeam(data || [])
    }

    fetchTeam()
  }, [])

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Karrierebaum</h1>
        {team.map(m => (
          <div key={m.id} className="border p-2 rounded mb-2">
            <p>{m.full_name} – {m.position}</p>
          </div>
        ))}
      </div>
    </>
  )
}
