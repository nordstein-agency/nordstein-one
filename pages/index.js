import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setMessage(error.message)
    else {
      setMessage('Erfolgreich eingeloggt!')
      router.push('/dashboard') // Weiterleitung
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
    </div>
  )
}
