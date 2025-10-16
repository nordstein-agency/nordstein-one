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

  if (!user) return <div className="p-4">Lädt...</div>

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Hauptinhalt mit Hintergrund-Farbverlauf */}
      <main className="min-h-screen bg-white relative">
        {/* Farbverlauf oben */}
        <div
          className="absolute top-0 left-0 w-full h-64 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #451a3d, transparent)'
          }}
        />
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto p-8">
          <h1 className="text-[32px] font-bold font-inter mb-6 text-[#1f1c1f]">
            Willkommen, {user.email}
          </h1>
          <p className="text-[16px] font-inter text-[#1f1c1f]">
            Das ist dein Dashboard. Alle wichtigen Infos und Statistiken werden hier angezeigt.
          </p>
        </div>
      </main>
    </>
  )
}
