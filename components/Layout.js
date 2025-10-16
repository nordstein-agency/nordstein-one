import { useEffect, useState } from 'react'

export default function Layout({ children }) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed Farbverlauf-Hintergrund */}
      <div
        className="fixed top-0 left-0 w-full h-screen z-0"
        style={{
          background: 'linear-gradient(to bottom, #451a3d, #ffffff)',
        }}
      ></div>

      {/* Weißer Overlay, der mit Scroll sichtbar wird */}
      <div
        className="absolute top-0 left-0 w-full h-full z-10"
        style={{
          backgroundColor: scrollY > 0 ? '#ffffff' : 'transparent',
          transition: 'background-color 0.5s ease',
        }}
      ></div>

      {/* Page Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  )
}
