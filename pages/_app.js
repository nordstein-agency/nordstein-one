import Layout from '../components/Layout'
import '../styles/globals.css'
import { SessionContextProvider } from '@supabase/auth-helpers-react'  // <-- HIER importieren
import { supabase } from '../lib/supabaseClient'


export default function App({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <Layout> 
        <Component {...pageProps} /> 
      </Layout>
    </SessionContextProvider>
  
  )
}
