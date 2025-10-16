// components/Layout.js
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Gradient oben */}
      <div className="absolute top-0 left-0 w-full h-[400px] pointer-events-none z-0"
           style={{ background: 'linear-gradient(to bottom, #451a3d, #ffffff)' }} />
      
      <div className="relative z-10">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  )
}
