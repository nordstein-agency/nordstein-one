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
    <Layout>>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-black">Willkommen, {user.email}</h1>
        <p className="mt-4 text-lg text-black">
          Dein Dashboard ist jetzt bereit.
        </p>
      </div>
    </Layout>
  )
}
