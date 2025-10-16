// components/Navbar.js
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="flex justify-center items-center py-6 gap-6 relative z-20">
      <button className="text-white font-medium text-[16px] tracking-wide" onClick={() => window.location.href='/dashboard'}>
        Dashboard
      </button>
      <button className="text-white font-medium text-[16px] tracking-wide" onClick={() => window.location.href='/customers'}>
        Kunden
      </button>
      <button className="text-white font-medium text-[16px] tracking-wide" onClick={() => window.location.href='/contracts'}>
        Verträge
      </button>
      <button className="text-white font-medium text-[16px] tracking-wide" onClick={() => window.location.href='/profile'}>
        Profil
      </button>
      <button className="text-white font-medium text-[16px] tracking-wide" onClick={() => window.location.href='/career'}>
        Karriere
      </button>
      <button onClick={handleLogout} className="ml-12 text-red-500 font-medium text-[16px]">
        Abmelden
      </button>
    </nav>
  )
}
