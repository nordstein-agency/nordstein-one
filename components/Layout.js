export default function Layout({ children }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'linear-gradient(to bottom, #451a3d, #ffffff 150px)',
      }}
    >
      {children}
    </div>
  )
}
