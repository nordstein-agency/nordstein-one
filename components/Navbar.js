import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Navbar() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    else window.location.href = "/login"; // Zielseite nach Logout
  };

  return (
    <nav className="relative z-20 flex justify-center items-center h-16 bg-transparent">
      <ul className="flex space-x-6 font-inter-tight text-white text-base">
        <li><button className="hover:opacity-80">Kunden</button></li>
        <li><button className="hover:opacity-80">Verträge</button></li>
        <li><button className="hover:opacity-80">Karriere</button></li>
      </ul>
      <button
        onClick={handleLogout}
        className="absolute right-6 text-white font-inter-tight hover:opacity-80"
      >
        Logout
      </button>
    </nav>
  );
}
