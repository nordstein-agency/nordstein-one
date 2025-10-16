import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    // Supabase sendet Magic Link an die eingegebene E-Mail
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
