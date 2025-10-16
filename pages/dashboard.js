// pages/dashboard.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
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

  if (!user) return <Layout><div className="p-4 text-center">Lädt...</div></Layout>

  return (
    <Layout>
      <Navbar />
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Willkommen, {user.email}</h1>
        <p className="mt-4 text-lg text-gray-700">
          Dies ist dein Dashboard. Hier findest du alle wichtigen Informationen auf einen Blick.
        </p>
      </div>
    </Layout>
  )
}
