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
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <div className="max-w-screen-xl mx-auto px-8 py-4 flex items-center justify-between font-[Inter_Tight]">
        {/* Logo */}
        <Link href="/" className="text-white font-bold text-[20px]">
          Nordstein
        </Link>

        {/* Links */}
        <div className="flex space-x-[24px] items-center">
          {['Dashboard','Kunden','Verträge','Profil','Karriere'].map((text, i) => (
            <Link
              key={i}
              href={`/${text.toLowerCase()}`}
              className="text-white text-[16px] font-normal no-underline hover:text-[#e6ded3] transition-colors"
            >
              {text}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white text-[16px] font-normal hover:text-[#e6ded3] transition-colors ml-6"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
