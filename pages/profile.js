
/*

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [customUser, setCustomUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState([])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        setLoading(false)
        return
      }
      setUser(authUser)

      const { data: customData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (error) {
        console.error(error)
      } else {
        setCustomUser(customData)
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!customUser) return
    fetchPartners(customUser)
  }, [customUser])

  const fetchPartners = async (currentUser) => {
    try {
      const { data: direct, error: err1 } = await supabase
        .from('users')
        .select('*')
        .eq('leader', currentUser.id)

      if (err1) throw err1

      const directIds = direct.map((d) => d.id)

      const { data: indirect, error: err2 } = await supabase
        .from('users')
        .select('*')
        .in('leader', directIds.length > 0 ? directIds : [''])

      if (err2) throw err2

      const allPartners = [...direct, ...indirect].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      )

      setPartners(allPartners)
    } catch (err) {
      console.error('Fehler beim Laden der Vertriebspartner:', err)
      setPartners([])
    }
  }

  if (loading) return <div>Lädt...</div>
  if (!customUser) return <div>Benutzerdaten nicht gefunden</div>

  return (
    <div className="p-4 text-[#451a3d]">
      <h1 className="nav-link mb-4 text-[#451a3d] font-bold text-2xl">
        Profil
      </h1>

      <div className="grid grid-cols-3 gap-8 mb-10">

        <div>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>Name:</strong> {customUser.first_name} {customUser.last_name}
            </span>
          </p>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>Position:</strong> {customUser.role || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>Vermittlernummer:</strong> {customUser.nordstein_id || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>Führungskraft:</strong> {customUser.leader || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>Adresse:</strong> {customUser.adress || '-'}
            </span>
          </p>
        </div>


        <div>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>Büroadresse:</strong> {customUser.office_adress || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>E-Mail privat:</strong> {customUser.email || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>E-Mail geschäftlich:</strong> {customUser.business_email || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>Telefon:</strong> {customUser.phone || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>Geburtsdatum:</strong> {customUser.birth_date || '-'}
            </span>
          </p>
        </div>


        <div>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>Bank:</strong> {customUser.bank_name || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#f2ebeb' }}>
              <strong>IBAN:</strong> {customUser.iban || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>BIC:</strong> {customUser.bic || '-'}
            </span>
          </p>
          <p>
            <span style={{ color: '#451a3d' }}>
              <strong>SV-Nr.:</strong> {customUser.sv_nr || '-'}
            </span>
          </p>
        </div>
      </div>


      <h2 className="text-2xl font-bold mb-4 text-[#451a3d]">Vertriebspartner</h2>

      {partners.length === 0 ? (
        <p className="text-[#451a3d]">Keine Vertriebspartner gefunden.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow text-[#451a3d]">
          <thead>
            <tr className="bg-gray-100 text-[#451a3d]">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Position</th>
              <th className="text-left p-3">Vermittlernummer</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50 text-[#451a3d]">
                <td className="p-3">{p.first_name} {p.last_name}</td>
                <td className="p-3">{p.role || '-'}</td>
                <td className="p-3">{p.nordstein_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

*/



/*



import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [authUser, setAuthUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null) // aktuell angezeigter User
  const [partners, setPartners] = useState([]) // Vertriebspartner des selektierten Users
  const [loading, setLoading] = useState(true)

  // 1️⃣ Auth User abrufen
  useEffect(() => {
    const fetchAuthUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) {
        setLoading(false)
        return
      }
      setAuthUser(user)

      // Custom User aus DB laden
      const { data: customData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()
      if (error) console.error(error)
      else {
        setSelectedUser(customData)
        fetchPartners(customData.id)
      }
      setLoading(false)
    }

    fetchAuthUser()
  }, [])

  // 2️⃣ Vertriebspartner für einen User laden
  const fetchPartners = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('leader', [userId]) // direkte Partner
      .order('first_name', { ascending: true })
    if (error) console.error(error)
    else setPartners(data || [])
  }

  // 3️⃣ Klick auf einen Partner
  const handleSelectPartner = async (partnerId) => {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single()
    if (error) return console.error(error)
    setSelectedUser(userData)
    fetchPartners(userData.id)
  }

  if (loading) return <div>Lädt...</div>
  if (!selectedUser) return <div>Benutzerdaten nicht gefunden</div>

  return (
      <div className="p-4">
        <h1 className="nav-link mb-4">Profil</h1>

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div>
            <p><span style={{ color: '#451a3d' }}><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Position:</strong> {selectedUser.role || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Vermittlernummer:</strong> {selectedUser.nordstein_id || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Führungskraft:</strong> {selectedUser.leader || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Adresse:</strong> {selectedUser.adress || '-'}</span></p>
          </div>

          <div>
            <p><span style={{ color: '#451a3d' }}><strong>Büroadresse:</strong> {selectedUser.office_adress || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>E-Mail privat:</strong> {selectedUser.email || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>E-Mail geschäftlich:</strong> {selectedUser.business_email || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Telefon:</strong> {selectedUser.phone || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>Geburtsdatum:</strong> {selectedUser.birth_date || '-'}</span></p>
          </div>

          <div>
            <p><span style={{ color: '#451a3d' }}><strong>Bank:</strong> {selectedUser.bank_name || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>IBAN:</strong> {selectedUser.iban || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>BIC:</strong> {selectedUser.bic || '-'}</span></p>
            <p><span style={{ color: '#451a3d' }}><strong>SV-Nr.:</strong> {selectedUser.sv_nr || '-'}</span></p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Vertriebspartner</h2>
        {partners.length === 0 ? (
          <p>Keine Vertriebspartner gefunden.</p>
        ) : (
          <table className="w-full border-collapse bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Position</th>
                <th className="text-left p-3">Vermittlernummer</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectPartner(p.id)}
                >
                  <td className="p-3">{p.first_name} {p.last_name}</td>
                  <td className="p-3">{p.role || '-'}</td>
                  <td className="p-3">{p.nordstein_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  )
}

      CODE ABOVE IS LAST STABLE WITH KLICKING ENABLED, BUT ONLY DIRECT PARTNERS ARE SHOWN

*/

/*

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [selectedUser, setSelectedUser] = useState(null) // aktuell angezeigter User
  const [customUser, setCustomUser] = useState(null) // Daten aus users-Tabelle
  const [leaderName, setLeaderName] = useState('-') // Name der Führungskraft
  const [partners, setPartners] = useState([]) // Vertriebspartner
  const [loading, setLoading] = useState(true)

  // 1️⃣ Angemeldeten User laden
  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        setLoading(false)
        return
      }
      setSelectedUser(authUser)

      // Custom User aus "users" Tabelle abrufen
      const { data: customData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (error) console.error(error)
      else setCustomUser(customData)

      setLoading(false)
    }
    fetchUser()
  }, [])

  // 2️⃣ Name der Führungskraft laden
  useEffect(() => {
    if (!customUser?.leader) return
    const fetchLeaderName = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', customUser.leader)
        .single()
      if (error) console.error(error)
      else setLeaderName(`${data.first_name} ${data.last_name}`)
    }
    fetchLeaderName()
  }, [customUser])

  // 3️⃣ Rekursive Funktion, um alle Partner (direkt + indirekt) zu laden
  const fetchPartnersRecursive = async (userId) => {
    let allPartners = []

    const fetchLevel = async (ids) => {
      if (!ids || ids.length === 0) return
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('leader', ids)
        .order('first_name', { ascending: true })
      if (error) {
        console.error('Fehler beim Laden der Partner:', error)
        return
      }
      if (data && data.length > 0) {
        allPartners.push(...data)
        const nextLevelIds = data.map((p) => p.id)
        await fetchLevel(nextLevelIds)
      }
    }

    await fetchLevel([userId])
    return allPartners
  }

  // 4️⃣ Vertriebspartner laden, wenn customUser gesetzt
  useEffect(() => {
    if (!customUser) return

    const loadPartners = async () => {
      setLoading(true)
      const allPartners = await fetchPartnersRecursive(customUser.id)
      setPartners(allPartners)
      setLoading(false)
    }

    loadPartners()
  }, [customUser])

  if (loading) return <div>Lädt...</div>
  if (!customUser) return <div>Benutzerdaten nicht gefunden</div>

  return (
    <div className="p-4">
      <h1 className="nav-link mb-4" style={{ color: '#451a3d' }}>Profil</h1>

      <div className="grid grid-cols-3 gap-8 mb-6">
        <div>
          <p style={{ color: '#451a3d' }}><strong>Name:</strong> {customUser.first_name} {customUser.last_name}</p>
          <p style={{ color: '#451a3d' }}><strong>Position:</strong> {customUser.role || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Vermittlernummer:</strong> {customUser.nordstein_id || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Führungskraft:</strong> {leaderName}</p>
          <p style={{ color: '#451a3d' }}><strong>Adresse:</strong> {customUser.adress || '-'}</p>
        </div>

        <div>
          <p style={{ color: '#451a3d' }}><strong>Büroadresse:</strong> {customUser.office_adress || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>E-Mail privat:</strong> {customUser.email || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>E-Mail geschäftlich:</strong> {customUser.business_email || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Telefon:</strong> {customUser.phone || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Geburtsdatum:</strong> {customUser.birth_date || '-'}</p>
        </div>

        <div>
          <p style={{ color: '#451a3d' }}><strong>Bank:</strong> {customUser.bank_name || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>IBAN:</strong> {customUser.iban || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>BIC:</strong> {customUser.bic || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>SV-Nr.:</strong> {customUser.sv_nr || '-'}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4" style={{ color: '#451a3d' }}>Vertriebspartner</h2>
      {partners.length === 0 ? (
        <p>Keine Vertriebspartner gefunden.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Name</th>
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Position</th>
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Vermittlernummer</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="p-3">{p.first_name} {p.last_name}</td>
                <td className="p-3">{p.role || '-'}</td>
                <td className="p-3">{p.nordstein_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}



*/




import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [selectedUser, setSelectedUser] = useState(null) // aktuell angezeigter User
  const [customUser, setCustomUser] = useState(null) // Daten aus users-Tabelle
  const [leaderName, setLeaderName] = useState('-') // Name der Führungskraft
  const [partners, setPartners] = useState([]) // Vertriebspartner
  const [loading, setLoading] = useState(true)

  const loadUserData = async (authUser) => {
    if (!authUser) return

    setLoading(true)
    setSelectedUser(authUser)

    const { data: customData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single()
    if (error) console.error(error)
    else setCustomUser(customData)

    if (customData?.leader) {
      const { data: leaderData, error: leaderError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', customData.leader)
        .single()
      if (leaderError) console.error(leaderError)
      else setLeaderName(`${leaderData.first_name} ${leaderData.last_name}`)
    } else {
      setLeaderName('-')
    }

    const allPartners = await fetchPartnersRecursive(customData.id)
    setPartners(allPartners)
    setLoading(false)
  }

  useEffect(() => {
    const fetchAuthUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        setLoading(false)
        return
      }
      await loadUserData(authUser)
    }
    fetchAuthUser()
  }, [])

  const fetchPartnersRecursive = async (userId) => {
    let allPartners = []

    const fetchLevel = async (ids) => {
      if (!ids || ids.length === 0) return
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('leader', ids)
        .order('first_name', { ascending: true })
      if (error) {
        console.error('Fehler beim Laden der Partner:', error)
        return
      }
      if (data && data.length > 0) {
        allPartners.push(...data)
        const nextLevelIds = data.map((p) => p.id)
        await fetchLevel(nextLevelIds)
      }
    }

    await fetchLevel([userId])
    return allPartners
  }

  if (loading) return <div>Lädt...</div>
  if (!customUser) return <div>Benutzerdaten nicht gefunden</div>

  return (
    <div className="p-4">
      <h1 className="nav-link mb-4" style={{ color: '#451a3d' }}>Profil</h1>

      <div className="grid grid-cols-3 gap-8 mb-6">
        <div>
          <p style={{ color: '#451a3d' }}><strong>Name:</strong> {customUser.first_name} {customUser.last_name}</p>
          <p style={{ color: '#451a3d' }}><strong>Position:</strong> {customUser.role || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Vermittlernummer:</strong> {customUser.nordstein_id || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Führungskraft:</strong> {leaderName}</p>
          <p style={{ color: '#451a3d' }}><strong>Adresse:</strong> {customUser.adress || '-'}</p>
        </div>

        <div>
          <p style={{ color: '#451a3d' }}><strong>Büroadresse:</strong> {customUser.office_adress || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>E-Mail privat:</strong> {customUser.email || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>E-Mail geschäftlich:</strong> {customUser.business_email || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Telefon:</strong> {customUser.phone || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>Geburtsdatum:</strong> {customUser.birth_date || '-'}</p>
        </div>

        <div>
          <p style={{ color: '#451a3d' }}><strong>Bank:</strong> {customUser.bank_name || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>IBAN:</strong> {customUser.iban || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>BIC:</strong> {customUser.bic || '-'}</p>
          <p style={{ color: '#451a3d' }}><strong>SV-Nr.:</strong> {customUser.sv_nr || '-'}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4" style={{ color: '#451a3d' }}>Vertriebspartner</h2>
      {partners.length === 0 ? (
        <p>Keine Vertriebspartner gefunden.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Name</th>
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Position</th>
              <th className="text-left p-3" style={{ color: '#451a3d' }}>Vermittlernummer</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr
                key={p.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={async () => {

                  const { data: partnerAuth } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', p.id)
                    .single()
                  if (partnerAuth) {
                    await loadUserData({ email: partnerAuth.email })
                  }
                }}
              >
                <td className="p-3">{p.first_name} {p.last_name}</td>
                <td className="p-3">{p.role || '-'}</td>
                <td className="p-3">{p.nordstein_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}








