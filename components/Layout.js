// components/Layout.js
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Farbverlauf nur im oberen Bereich */}
      <div
        className="absolute top-0 left-0 w-full h-[400px] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #451a3d 0%, #ffffff 100%)',
        }}
      ></div>

      {/* Navbar + Content */}
      <div className="relative z-10">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  )
}
