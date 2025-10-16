import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const session = supabase.auth.getSession()
    session.then(({ data }) => {
      if (!data.session) {
        router.push('/login') // nicht eingeloggt → zurück zu Login
      } else {
        setUser(data.session.user) // eingeloggt → Dashboard anzeigen
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])
  
  if (!user) return <div>Lädt...</div>

  return <div>Willkommen, {user.email}</div>
}
