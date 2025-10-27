import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

// 💡 Konstante für Rollen-Mapping 💡
// Vertriebspartner (User-Tabelle) haben die höchste Berechtigungsstufe
const ROLE_FULL_ACCESS = 'full_access';
// Partneragenturen (Partners-Tabelle) haben eingeschränkten Zugang
const ROLE_PARTNER_AGENCY = 'partner_agency'; 
// Standardwert, falls nicht gefunden, oder nur eingeloggt
const ROLE_GUEST = 'guest'; 

export default function Navbar() {
  const [user, setUser] = useState(null);
  // NEU: Zustand für die berechnete Rolle
  const [userRole, setUserRole] = useState(ROLE_GUEST);

  // -------------------------------------------------------------------------
  // 🔹 Funktion zur Rollenbestimmung
  // -------------------------------------------------------------------------
  const checkUserRole = useCallback(async (email) => {
    if (!email) return ROLE_GUEST;

    // 1. In der "users"-Tabelle (Vertriebspartner = FULL ACCESS) prüfen
    // Bei einem Match ist der User ein Vertriebspartner und erhält vollen Zugriff.
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userData) {
      return ROLE_FULL_ACCESS;
    }

    // 2. In der "partners"-Tabelle (Partneragentur = EINGESCHRÄNKTER ZUGRIFF) prüfen
    // Nur prüfen, wenn er NICHT in der "users" Tabelle gefunden wurde.
    const { data: partnerData } = await supabase
      .from('partners')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (partnerData) {
      return ROLE_PARTNER_AGENCY;
    }

    // 3. Wenn in keiner Tabelle gefunden
    return ROLE_GUEST;
  }, []);
  
  // -------------------------------------------------------------------------
  // 🔹 useEffect für Auth-Status und Rollenzuweisung
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchAndCheckUser = async (currentSession) => {
        const authUser = currentSession?.user || null;
        setUser(authUser);
        
        let role = ROLE_GUEST;
        if (authUser) {
            role = await checkUserRole(authUser.email);
        }
        setUserRole(role);
    };

    // Initialer Fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
        fetchAndCheckUser(session);
    });

    // Listener für Auth-Status-Änderungen
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndCheckUser(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, [checkUserRole]); // checkUserRole ist stabil (durch useCallback), kann hier rein

  // -------------------------------------------------------------------------
  // 🔹 Logout
  // -------------------------------------------------------------------------
  const handleLogout = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // -------------------------------------------------------------------------
  // 🔹 Rendering der Navigation
  // -------------------------------------------------------------------------

  // Hilfsfunktion zur bedingten Anzeige der Links
  const renderNavLinks = () => {
    // 🛑 Wichtig: Die volle Berechtigung umfasst auch den Fall, 
    // dass der User in BEIDEN Tabellen ist, da er zuerst in 'users' geprüft wird.
    if (userRole === ROLE_FULL_ACCESS) {
      return (
        <>
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/customers" className="nav-link">Kunden</Link>
          <Link href="/contracts" className="nav-link">Verträge</Link>
          <Link href="/profile" className="nav-link">Profil</Link>
          <Link href="/projects" className="nav-link">Projekte</Link>
          <Link href="/career" className="nav-link">Karriere</Link>
        </>
      );
    } 
    
    // Eingeschränkter Zugriff (Partneragentur)
    else if (userRole === ROLE_PARTNER_AGENCY) {
      return (
        <>
          <Link href="/profile" className="nav-link">Profil</Link>
          <Link href="/projects" className="nav-link">Projekte</Link>
        </>
      );
    }
    
    // Keine Berechtigung oder noch nicht geprüft (keine Links anzeigen)
    return null;
  };

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center py-6 relative">

        {/* Logo / Text links */}
        <div className="absolute left-0">
          <span className="nav-link font-bold tracking-wider cursor-default">
            NORDSTEIN ONE
          </span>
        </div>

        {/* Navigation (nur wenn eingeloggt) */}
        {user && (
          <>
            {/* 🛑 HIER WIRD DIE NAVIGATION BEDINGT GERENDERT */}
            <div className="flex gap-6">
              {renderNavLinks()}
            </div>

            <a
              href="#"
              onClick={handleLogout}
              className="nav-link absolute right-0"
            >
              Abmelden
            </a>
          </>
        )}
      </nav>
    </header>
  )
}