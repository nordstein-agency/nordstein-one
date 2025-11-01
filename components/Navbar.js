
/*

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

// 💡 Konstante für Rollen-Mapping 💡
// Benutzer mit anderer Rolle als "Partner"
const ROLE_FULL_ACCESS = 'full_access';
// Partneragenturen (Rolle = "Partner")
const ROLE_PARTNER_AGENCY = 'partner_agency'; 
// Standardwert, falls nicht gefunden, oder nur eingeloggt
const ROLE_GUEST = 'guest'; 

export default function Navbar() {
  const [user, setUser] = useState(null);
  // Zustand für die berechnete Rolle
  const [userRole, setUserRole] = useState(ROLE_GUEST);

  // -------------------------------------------------------------------------
  // 🔹 Funktion zur Rollenbestimmung (VEREINFACHT)
  // -------------------------------------------------------------------------
  const checkUserRole = useCallback(async (email) => {
    if (!email) return ROLE_GUEST;

    // Nur in der "users"-Tabelle nach der Rolle prüfen
    const { data: userData } = await supabase
      .from('users')
      .select('role') // Nur die Rolle abfragen
      .eq('email', email)
      .maybeSingle();

    if (!userData || !userData.role) {
      // Kein Eintrag in users gefunden
      return ROLE_GUEST;
    }

    const role = userData.role.toLowerCase();

    // Wenn Rolle explizit "Partner" ist, eingeschränkten Zugang geben
    if (role === 'partner') {
      return ROLE_PARTNER_AGENCY;
    }

    // Für alle anderen Rollen (z.B. Sales Trainee, Sales Manager, etc.) vollen Zugang geben
    return ROLE_FULL_ACCESS;
    
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
  }, [checkUserRole]);

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
    // Voller Zugang (Rolle ist NICHT "Partner")
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
    
    // Eingeschränkter Zugang (Rolle ist "Partner"): Profil, Projekte, Dashboard
    else if (userRole === ROLE_PARTNER_AGENCY) {
      return (
        <>
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/profile" className="nav-link">Profil</Link>
          <Link href="/projects" className="nav-link">Projekte</Link>
        </>
      );
    }
    
    // Keine Links anzeigen
    return null;
  };

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center py-6 relative">

        <div className="absolute left-0">
          <span className="nav-link font-bold tracking-wider cursor-default">
            NORDSTEIN ONE
          </span>
        </div>

        {user && (
          <>
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

*/

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabaseClient"
import Link from "next/link"

const ROLE_FULL_ACCESS = "full_access"
const ROLE_PARTNER_AGENCY = "partner_agency"
const ROLE_GUEST = "guest"

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(ROLE_GUEST)

  // 🔹 Rolle prüfen
  const checkUserRole = useCallback(async (email) => {
    if (!email) return ROLE_GUEST

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .maybeSingle()

    if (!userData || !userData.role) return ROLE_GUEST

    const role = userData.role.toLowerCase()
    if (role === "partner") return ROLE_PARTNER_AGENCY
    return ROLE_FULL_ACCESS
  }, [])

  // 🔹 Auth-Status prüfen
  useEffect(() => {
    const fetchAndCheckUser = async (session) => {
      const authUser = session?.user || null
      setUser(authUser)
      let role = ROLE_GUEST
      if (authUser) {
        role = await checkUserRole(authUser.email)
      }
      setUserRole(role)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAndCheckUser(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndCheckUser(session)
    })

    return () => listener?.subscription.unsubscribe()
  }, [checkUserRole])

  // 🔹 Logout
  const handleLogout = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // 🔹 Navigation nach Rolle
  const renderNavLinks = () => {
    if (userRole === ROLE_FULL_ACCESS) {
      return (
        <>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/customers" className="nav-link">
            Kunden
          </Link>
          <Link href="/contracts" className="nav-link">
            Verträge
          </Link>

          {/* 🔽 Projekte mit Dropdown */}
          <div className="relative group">
            <Link href="/projects" className="nav-link">
              Projekte
            </Link>

            <div
              className="absolute left-0 mt-2 w-52 bg-white shadow-lg border border-[#d9c8d5] 
                         z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                         transition-opacity duration-200 ease-out"
            >
              <Link
                href="/projects"
                className="block px-4 py-2 text-center text-[#451a3d] no-underline hover:bg-[#f9f7f8] hover:text-[#6b3c67] transition-all"
              >
                Projekte
              </Link>
              <div className="border-t border-[#d9c8d5]" />
              <Link
                href="/offer-calculator"
                className="block px-4 py-2 text-center text-[#451a3d] no-underline hover:bg-[#f9f7f8] hover:text-[#6b3c67] transition-all"
              >
                Angebotsrechner
              </Link>
            </div>
          </div>

          <Link href="/profile" className="nav-link">
            Profil
          </Link>
          <Link href="/career" className="nav-link">
            Karriere
          </Link>
        </>
      )
    } else if (userRole === ROLE_PARTNER_AGENCY) {
      return (
        <>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/profile" className="nav-link">
            Profil
          </Link>

          {/* 🔽 Projekte mit Dropdown auch für Partner */}
          <div className="relative group">
            <Link href="/projects" className="nav-link">
              Projekte
            </Link>

            <div
              className="absolute left-0 mt-2 w-52 bg-white shadow-lg border border-[#d9c8d5] 
                         z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                         transition-opacity duration-200 ease-out"
            >
              <Link
                href="/projects"
                className="block px-4 py-2 text-center text-[#451a3d] no-underline hover:bg-[#f9f7f8] hover:text-[#6b3c67] transition-all"
              >
                Projekte
              </Link>
              <div className="border-t border-[#d9c8d5]" />
              <Link
                href="/offer-calculator"
                className="block px-4 py-2 text-center text-[#451a3d] no-underline hover:bg-[#f9f7f8] hover:text-[#6b3c67] transition-all"
              >
                Angebotsrechner
              </Link>
            </div>
          </div>
        </>
      )
    }

    return null
  }

  return (
    <header className="relative w-full">
      <nav className="max-w-6xl mx-auto flex items-center justify-center py-6 relative">
        {/* Logo */}
        <div className="absolute left-0">
          <span className="nav-link font-bold tracking-wider cursor-default">
            NORDSTEIN ONE
          </span>
        </div>

        {/* Navigation (nur wenn eingeloggt) */}
        {user && (
          <>
            <div className="flex gap-6">{renderNavLinks()}</div>

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
