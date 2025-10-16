// components/Layout.js
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Farbverlauf nur oben */}
      <div
        className="absolute top-0 left-0 w-full h-64 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #451a3d, transparent)',
          zIndex: 0,
        }}
      />

      {/* Content über Farbverlauf */}
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-6xl mx-auto p-8">{children}</main>
      </div>
    </div>
  )
}
