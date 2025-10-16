// pages/dashboard.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
      else setUser(data.session.user)
    })
  }, [])

  if (!user) return <div>Lädt...</div>

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-[32px] font-bold text-white mb-6">
          Willkommen, {user.email}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-black">
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Kunden</h2>
            <p>Anzahl der Kunden, Analysen, etc.</p>
          </div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Verträge</h2>
            <p>Offene Verträge und Einheiten.</p>
          </div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Karriere</h2>
            <p>Teamübersicht, Mitarbeiter und Positionen.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
