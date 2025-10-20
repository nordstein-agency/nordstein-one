
/*

import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image';


export default function Navbar() {
  const handleLogout = async (e) => {
    e.preventDefault() // verhindert Standard-Link-Verhalten
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center py-6 relative">

      <div className="absolute left-0">
        <span className="nav-link font-bold tracking-wider cursor-default">
        NORDSTEIN ONE
        </span>
      </div>


        <div className="flex gap-6">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/customers" className="nav-link">Kunden</Link>
          <Link href="/contracts" className="nav-link">Verträge</Link>
          <Link href="/profile" className="nav-link">Profil</Link>
          <Link href="/career" className="nav-link">Karriere</Link>
        </div>

        <a
          href="#"
          onClick={handleLogout}
          className="nav-link absolute right-0"
        >
          Abmelden
        </a>
      </nav>
    </header>
  )
}


*/

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)

  // Prüfe, ob User eingeloggt ist
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }
    fetchUser()

    // Wenn sich der Auth-Status ändert (Login/Logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleLogout = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center py-6 relative">

        {/* Logo / Text links */}
        <div className="absolute left-0">
          <span className="nav-link font-bold tracking-wider cursor-default">
            NORDSTEIN ONE
          </span>
        </div>

        {/* Navigation (nur wenn eingeloggt) */}
        {user && (
          <>
            <div className="flex gap-6">
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <Link href="/customers" className="nav-link">Kunden</Link>
              <Link href="/contracts" className="nav-link">Verträge</Link>
              <Link href="/profile" className="nav-link">Profil</Link>
              <Link href="/career" className="nav-link">Karriere</Link>
            </div>

            <a
              href="#"
              onClick={handleLogout}
              className="nav-link absolute right-0"
            >
              Abmelden
            </a>
          </>
        )}
      </nav>
    </header>
  )
}
