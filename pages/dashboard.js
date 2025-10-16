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

  if (!user) return <Layout><div className="p-4 text-black">Lädt...</div></Layout>

  return (
    <Layout>
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold text-[#1f1c1f] mb-4">Willkommen, {user.email}</h1>
        <p className="text-[#1f1c1f] text-base">Hier kannst du deine Dashboard-Infos sehen.</p>
      </div>
    </Layout>
  )
}
