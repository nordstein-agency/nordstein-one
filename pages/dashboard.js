
/*

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
      else setUser(data.session.user)
    })
  }, [])

  if (!user) return <div className="p-4">Lädt...</div>

  return (

      <div className="nav-link">
        <h1 className="text-3xl font-bold text-black">Willkommen, {user.email}</h1>
        <p className="mt-4 text-lg text-black">
          Dein Dashboard ist jetzt bereit.
        </p>
      </div>

  )
}

*/
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      // 🔐 Session prüfen
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
        return
      }

      setUser(session.user)

      // 🧑 Benutzerprofil laden
      const { data: profileData, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('email', session.user.email)
        .single()

      if (error) {
        console.error('Fehler beim Laden des Profils:', error)
      } else {
        setProfile(profileData)
      }

      setLoading(false)
    }

    loadUser()

    // 🔄 Bei Auth-Änderung automatisch ausloggen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) router.push('/')
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Lädt dein Dashboard...
      </div>
    )
  }

  const fullName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user?.email

  const primaryColor = '#451a3d' // Dunkelviolett
  const secondaryColor = '#c3b1cc' // Helles Lila

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center"
      style={{
        backgroundColor: '#faf9fb',
        color: primaryColor,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="p-8 bg-white shadow-lg rounded-2xl border border-gray-100">
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ color: primaryColor }}
        >
          Willkommen, {fullName} 👋
        </h1>
        <p className="text-lg" style={{ color: secondaryColor }}>
          Dein Dashboard ist jetzt bereit.
        </p>
      </div>
    </div>
  )
}
