import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  // NEU: Lade-Status für die Session-Prüfung
  const [loading, setLoading] = useState(true) 

  // 🚨 HINZUGEFÜGT: Überprüfen der Session beim Laden der Seite
  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      // Versucht, die aktuelle Supabase-Sitzung abzurufen
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session && !error) {
        // Wenn eine aktive Sitzung gefunden wird, sofort weiterleiten
        router.replace('/dashboard')
      } else {
        // Keine Sitzung gefunden, zeige das Login-Formular
        setLoading(false)
      }
    }

    checkSessionAndRedirect()
  }, [router]) // Abhängigkeit vom Router-Objekt

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) setMessage(error.message)
    else {
      setMessage('Erfolgreich eingeloggt!')
      // Nach erfolgreichem Login direkt zum Dashboard
      router.push('/dashboard')
    }
  }

  // Zeigt den Ladezustand, um zu verhindern, dass das Formular kurz aufblinkt
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-gray-700">Prüfe Anmeldung...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Login</h1>

        <div className="flex flex-col gap-6">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>

        {message && <p className="mt-6 text-center text-red-500">{message}</p>}
      </div>
    </div>
  )
}