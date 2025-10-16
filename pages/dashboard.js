// pages/dashboard.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
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

  if (!user) return <div className="p-8">Lädt...</div>

  return (
    <Layout>
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          Willkommen, {user.email}
        </h1>
        {/* Platz für Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow-md">Kunden Übersicht</div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow-md">Verträge Übersicht</div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow-md">Karriere Übersicht</div>
        </div>
      </div>
    </Layout>
  )
}
