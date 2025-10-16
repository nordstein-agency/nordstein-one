import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
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

  if (!user) return <div>Lädt...</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#451a3d] to-white">
      <Navbar />
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white md:text-black">Willkommen, {user.email}</h1>
      </div>
    </div>
  )
}
