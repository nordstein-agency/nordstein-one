import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Home() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) setMessage(error.message)
    else setMessage('Check your email for login link!')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Nordstein One – Login</h1>
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded mb-2 w-64"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-64">
        Login
      </button>
      <p className="mt-2">{message}</p>
    </div>
  )
}
