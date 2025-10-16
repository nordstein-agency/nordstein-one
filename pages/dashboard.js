import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const handleAuth = async () => {
      // Magic Link Tokens aus URL auslesen
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
      if (error) {
        console.error('Error verifying magic link:', error)
        router.push('/') // fehlerhaft → zurück zum Login
      } else if (data.session) {
        setUser(data.session.user)
      } else {
        // Keine Session → zurück zum Login
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) router.push('/')
        else setUser(sessionData.session.user)
      }
    }

    handleAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser(session.user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!user) return <div>Lädt...</div>

  return <div>Willkommen, {user.email}</div>
}
