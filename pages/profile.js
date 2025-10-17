import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user))
  }, [])

  if (!user) return <div>Lädt...</div>

  return (
  <Layout>
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Profil</h1>
      <p>Name: {user.user_metadata?.full_name || '-'}</p>
      <p>Email: {user.email}</p>
    </div>
  </Layout>
)
}
