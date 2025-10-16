import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // zurück zur Login-Seite
  }

  return (
    <nav className="w-full flex justify-center py-6 bg-transparent">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="text-white font-inter text-[16px] no-underline hover:text-[#e6ded3] visited:text-white active:text-white"
        >
          Dashboard
        </Link>
        <Link
          href="/customers"
          className="text-white font-inter text-[16px] no-underline hover:text-[#e6ded3] visited:text-white active:text-white"
        >
          Kunden
        </Link>
        <Link
          href="/contracts"
          className="text-white font-inter text-[16px] no-underline hover:text-[#e6ded3] visited:text-white active:text-white"
        >
          Verträge
        </Link>
        <Link
          href="/profile"
          className="text-white font-inter text-[16px] no-underline hover:text-[#e6ded3] visited:text-white active:text-white"
        >
          Profil
        </Link>
        <Link
          href="/career"
          className="text-white font-inter text-[16px] no-underline hover:text-[#e6ded3] visited:text-white active:text-white"
        >
          Karriere
        </Link>
        <button
          onClick={handleLogout}
          className="text-white font-inter text-[16px] ml-6 hover:text-[#e6ded3]"
        >
          Abmelden
        </button>
      </div>
    </nav>
  )
}
