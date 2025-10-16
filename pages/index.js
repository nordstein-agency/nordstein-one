import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Prüfen, ob Benutzer eingeloggt ist
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard') // automatisch weiterleiten
      }
    })

    // Listener für Magic Link / Session-Changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard') // weiterleiten nach Login
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Check your email for login link!')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Nordstein One – Login</h1>
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginRight: '1rem' }}
      />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
    </div>
  )
}
