// components/Layout.js
export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Farbverlauf oben */}
      <div
        className="absolute top-0 left-0 w-full h-64 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #451a3d, #ffffff)', // Lila → Weiß
          zIndex: 0,
        }}
      />

      {/* Content über dem Farbverlauf */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
