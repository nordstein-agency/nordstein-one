import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-[#451a3d] text-white shadow p-4 flex items-center gap-6 font-interTight">
      <Link href="/dashboard" className="hover:text-[#e6ded3]">Dashboard</Link>
      <Link href="/customers" className="hover:text-[#e6ded3]">Kunden</Link>
      <Link href="/contracts" className="hover:text-[#e6ded3]">Verträge</Link>
      <Link href="/profile" className="hover:text-[#e6ded3]">Profil</Link>
      <Link href="/career" className="hover:text-[#e6ded3]">Karriere</Link>
      <button onClick={handleLogout} className="ml-auto bg-red-500 hover:bg-red-600 px-4 py-1 rounded">
        Abmelden
      </button>
    </nav>
  )
}
