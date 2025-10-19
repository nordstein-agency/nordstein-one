import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function SetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Supabase hängt Token automatisch in URL
  const { access_token } = router.query

  const handleSetPassword = async () => {
    if (!password || !passwordConfirm) {
      setMessage('Bitte beide Passwortfelder ausfüllen.')
      return
    }

    if (password !== passwordConfirm) {
      setMessage('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)

    try {
      // Passwort setzen über Supabase
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage('Fehler: ' + error.message)
      } else {
        setMessage('Passwort erfolgreich gesetzt! Du kannst dich jetzt einloggen.')
      }
    } catch (err) {
      setMessage('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Passwort setzen</h1>

        <div className="flex flex-col gap-6">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Passwort wiederholen"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSetPassword}
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Lädt...' : 'Passwort setzen'}
          </button>
        </div>

        {message && (
          <p
            className={`mt-6 text-center ${
              message.includes('erfolgreich') ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
