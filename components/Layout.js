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
      {/* Fixed Gradient Hintergrund */}
      <div
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #451a3d 0%, #ffffff 400px, #ffffff 100%)',
        }}
      ></div>

      {/* Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
