import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Gradient oben */}
      <div
        className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#451a3d] to-white pointer-events-none"
      />
      
      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
