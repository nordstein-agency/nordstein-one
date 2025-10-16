import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
      else setUser(data.session.user)
    })
  }, [])

  if (!user) return <div className="flex justify-center items-center h-screen text-xl">Lädt...</div>

  return (
    <div className="bg-[#1f1c1f] min-h-screen text-white font-interTight">
      <Navbar />

      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-4xl nordsteinPurple font-matter font-bold mb-6">
          Willkommen, {user.email}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#e6ded3] text-[#1f1c1f] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Kunden</h2>
            <p>Übersicht über deine Kunden, Einheiten, Einreichungen usw.</p>
          </div>

          <div className="bg-[#e6ded3] text-[#1f1c1f] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Verträge</h2>
            <p>Hier kannst du alle eingereichten Verträge einsehen.</p>
          </div>

          <div className="bg-[#e6ded3] text-[#1f1c1f] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Profil</h2>
            <p>Deine persönlichen Daten und Karriereposition.</p>
          </div>

          <div className="bg-[#e6ded3] text-[#1f1c1f] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Karriere</h2>
            <p>Hier siehst du deine Mitarbeiterstruktur im Tree.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
