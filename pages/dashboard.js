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

  if (!user) return <div className="text-center mt-20">Lädt...</div>

  return (
    <Layout>
      <Navbar />
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1f1c1f] mb-6">
          Willkommen, {user.email}
        </h1>
        <p className="text-[#1f1c1f] text-lg">
          Hier ist dein Dashboard. Später kommen hier Statistiken, deine Kunden, Verträge und weitere Infos.
        </p>
      </div>
    </Layout>
  )
}
