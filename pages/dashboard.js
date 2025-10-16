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
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white">Willkommen, {user.email}</h1>
      </div>
    </Layout>
  )
}
