import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/') // nicht eingeloggt → zurück zur Login-Seite
      else setUser(data.session.user) // eingeloggt → Dashboard anzeigen
    })
  }, [])

  if (!user) return <div className="p-4">Lädt...</div>

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[32px] font-bold font-inter mb-6 text-[#1f1c1f]">
            Willkommen, {user.email}
          </h1>

          {/* Hier kannst du später weitere Dashboard-Inhalte einfügen */}
          <p className="text-[16px] font-inter text-[#1f1c1f]">
            Das ist dein Dashboard. Alle wichtigen Infos und Statistiken werden hier angezeigt.
          </p>
        </div>
      </main>
    </>
  )
}
