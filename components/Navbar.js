import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // zurück zur Login-Seite
  }

  return (
    <nav className="bg-white shadow p-4 flex items-center gap-6">
      <Link href="/dashboard" className="text-nordsteinPurple font-heading hover:text-blackBody">
        Dashboard
      </Link>
      <Link href="/customers" className="text-blackBody hover:text-nordsteinPurple">Kunden</Link>
      <Link href="/contracts" className="text-blackBody hover:text-nordsteinPurple">Verträge</Link>
      <Link href="/profile" className="text-blackBody hover:text-nordsteinPurple">Profil</Link>
      <Link href="/career" className="text-blackBody hover:text-nordsteinPurple">Karriere</Link>
      <button 
        onClick={handleLogout} 
        className="ml-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        Abmelden
      </button>
    </nav>
  )
}
