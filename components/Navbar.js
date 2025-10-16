import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    router.push('/') // zurück zur Login-Seite
  }

  if (!user) return null

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-3xl font-bold text-[#451a3d]">
          Nordstein
        </Link>

        {/* Links als Buttons */}
        <div className="flex space-x-4 justify-center flex-1">
          {['Dashboard','Kunden','Verträge','Profil','Karriere'].map((text, i) => (
            <Link
              key={i}
              href={`/${text.toLowerCase()}`}
              className="px-4 py-2 rounded-lg bg-[#451a3d] text-white font-semibold text-lg hover:bg-[#3a1535] transition-colors"
            >
              {text}
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-lg hover:bg-red-600 transition-colors"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
