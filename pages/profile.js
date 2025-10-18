


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








