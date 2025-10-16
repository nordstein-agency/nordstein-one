import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // zurück zur Login-Seite
  }

  return (
    <nav className="flex justify-center gap-6 py-4 bg-transparent">
      <Link href="/dashboard">
        <a className="text-[#e6ded3] font-inter-tight text-base hover:underline">Dashboard</a>
      </Link>
      <Link href="/customers">
        <a className="text-[#e6ded3] font-inter-tight text-base hover:underline">Kunden</a>
      </Link>
      <Link href="/contracts">
        <a className="text-[#e6ded3] font-inter-tight text-base hover:underline">Verträge</a>
      </Link>
      <Link href="/profile">
        <a className="text-[#e6ded3] font-inter-tight text-base hover:underline">Profil</a>
      </Link>
      <Link href="/career">
        <a className="text-[#e6ded3] font-inter-tight text-base hover:underline">Karriere</a>
      </Link>
      <button 
        onClick={handleLogout} 
        className="text-red-500 font-inter-tight text-base ml-6"
      >
        Abmelden
      </button>
    </nav>
  )
}
