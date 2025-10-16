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
    router.push('/')
  }

  if (!user) return null

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
      <div className="max-w-screen-xl mx-auto px-8 py-6 flex justify-between items-center font-[Inter_Tight]">
        {/* Logo */}
        <Link href="/" className="text-4xl font-bold text-[#451a3d]">
          Nordstein
        </Link>

        {/* Links als Buttons */}
        <div className="flex space-x-8 justify-center flex-1">
          {['Dashboard','Kunden','Verträge','Profil','Karriere'].map((text, i) => (
            <Link
              key={i}
              href={`/${text.toLowerCase()}`}
              className="px-6 py-3 rounded-lg bg-[#e6ded3] text-[#1f1c1f] font-semibold text-xl no-underline hover:bg-[#d2c9b9] transition-colors"
            >
              {text}
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-lg bg-red-500 text-white font-semibold text-xl hover:bg-red-600 transition-colors"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
