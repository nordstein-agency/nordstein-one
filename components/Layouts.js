import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from './Navbar'
import { supabase } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/') // nicht eingeloggt → Login
      } else {
        setUser(data.session.user)
      }
    }
    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/')
      else setUser(session.user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!user) return <div className="p-4 text-center">Lädt...</div>

  return (
    <>
      <Navbar />
      <main className="p-6">{children}</main>
    </>
  )
}
