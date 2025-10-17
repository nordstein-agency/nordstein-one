import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center gap-6 py-6">

        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        


        <Link href="/customers" className="nav-link">Kunden</Link>
        <Link href="/contracts" className="nav-link">Verträge</Link>
        <Link href="/profile" className="nav-link">Profil</Link>
        <Link href="/career" className="nav-link">Karriere</Link>
        <button onClick={handleLogout} className="text-white font-inter text-[16px] ml-6 hover:text-[#e6ded3]">Abmelden</button>
      </nav>
    </header>
  )
}
