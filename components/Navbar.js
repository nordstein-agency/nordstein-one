import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/')
      else setUser(data.session.user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // zurück zur Login-Seite
  }

  if (!user) return <div>Lädt...</div>

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-nordsteinPurple">
          Nordstein
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          <Link href="/dashboard" className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark">
            Dashboard
          </Link>
          <Link href="/customers" className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark">
            Kunden
          </Link>
          <Link href="/contracts" className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark">
            Verträge
          </Link>
          <Link href="/profile" className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark">
            Profil
          </Link>
          <Link href="/career" className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark">
            Karriere
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-lg text-nordsteinPurple hover:text-nordsteinPurpleDark md:hidden"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
