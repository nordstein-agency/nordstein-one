import '../styles/globals.css'

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-nordsteinPurple to-white">
      <Component {...pageProps} />
    </div>
  )
}
