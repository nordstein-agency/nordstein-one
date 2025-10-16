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

  if (!user) return <div className="p-4">Lädt...</div>

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-[#ffffff] mb-8">Willkommen, {user.email}</h1>
        <p className="text-[#1f1c1f] text-lg">
          Hier siehst du dein Dashboard mit allen wichtigen Infos.
        </p>
      </div>
    </Layout>
  )
}
