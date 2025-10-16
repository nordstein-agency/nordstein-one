import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex gap-4">
      <Link href="/dashboard" className="hover:text-blue-500">Dashboard</Link>
      <Link href="/customers" className="hover:text-blue-500">Kunden</Link>
      <Link href="/contracts" className="hover:text-blue-500">Verträge</Link>
      <Link href="/profile" className="hover:text-blue-500">Profil</Link>
      <Link href="/career" className="hover:text-blue-500">Karriere</Link>
    </nav>
  )
}
