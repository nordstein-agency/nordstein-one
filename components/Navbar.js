// components/Navbar.js
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="flex justify-center items-center gap-6 py-6">
      <Link href="/dashboard" className="text-[#e6ded3] text-lg font-medium hover:opacity-80 transition">
        Dashboard
      </Link>
      <Link href="/customers" className="text-[#e6ded3] text-lg font-medium hover:opacity-80 transition">
        Kunden
      </Link>
      <Link href="/contracts" className="text-[#e6ded3] text-lg font-medium hover:opacity-80 transition">
        Verträge
      </Link>
      <Link href="/profile" className="text-[#e6ded3] text-lg font-medium hover:opacity-80 transition">
        Profil
      </Link>
      <Link href="/career" className="text-[#e6ded3] text-lg font-medium hover:opacity-80 transition">
        Karriere
      </Link>
      <button
        onClick={handleLogout}
        className="text-red-500 text-lg font-medium ml-6 hover:opacity-80 transition"
      >
        Abmelden
      </button>
    </nav>
  )
}
