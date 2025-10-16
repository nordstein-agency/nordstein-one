import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // zurück zur Login-Seite
  }

  return (
    <nav className="bg-white shadow p-4 flex gap-4">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/customers">Kunden</Link>
      <Link href="/contracts">Verträge</Link>
      <Link href="/profile">Profil</Link>
      <Link href="/career">Karriere</Link>
      <button onClick={handleLogout} className="ml-auto text-red-500">
        Abmelden
      </button>
    </nav>
  )
}
