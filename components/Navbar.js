// components/Navbar.js
import { signOut } from '@supabase/auth-helpers-nextjs';

export default function Navbar() {
  return (
    <nav className="relative z-20 flex justify-center items-center h-16 bg-transparent">
      <ul className="flex space-x-6 font-inter-tight text-white text-base">
        <li><button className="hover:opacity-80">Kunden</button></li>
        <li><button className="hover:opacity-80">Verträge</button></li>
        <li><button className="hover:opacity-80">Karriere</button></li>
      </ul>
      <button
        onClick={() => signOut()}
        className="absolute right-6 text-white font-inter-tight hover:opacity-80"
      >
        Logout
      </button>
    </nav>
  );
}
