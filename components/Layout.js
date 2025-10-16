// components/Layout.js
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Header-Gradient */}
      <div className="bg-gradient-to-b from-[#451a3d] to-white h-[400px] w-full absolute top-0 left-0 z-0" />

      <div className="relative z-10">
        <Navbar />
        <main className="pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
