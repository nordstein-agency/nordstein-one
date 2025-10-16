import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Listener für Auth-Status
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // Magic Link erfolgreich -> weiterleiten
          router.push('/dashboard')
        }
      }
    )
    return () => {
      authListener?.unsubscribe()
    }
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
