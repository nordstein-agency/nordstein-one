import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
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
      <h1 className="text-3xl font-semibold text-nordsteinPurple mb-4">Willkommen im Dashboard</h1>
      <p className="text-black text-lg">
        Hier siehst du deine Übersicht. Nutze das Menü oben, um zu Kunden, Verträgen oder deiner Karriere zu navigieren.
      </p>
    </Layout>
  )
}
