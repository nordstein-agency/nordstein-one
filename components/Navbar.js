// components/Navbar.js
export default function Navbar() {
  return (
    <nav className="bg-transparent py-4 px-8 flex justify-center space-x-6">
      <a
        href="/dashboard"
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Dashboard
      </a>
      <a
        href="/customers"
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Kunden
      </a>
      <a
        href="/contracts"
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Verträge
      </a>
      <a
        href="/profile"
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Profil
      </a>
      <a
        href="/career"
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Karriere
      </a>
      <button
        onClick={logout}
        className="text-white text-lg font-inter tracking-tight hover:text-[#451a3d] transition-colors duration-200"
      >
        Abmelden
      </button>
    </nav>
  )
}

async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/'
}
