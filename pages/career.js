


import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// --- Karriere-Stufen ---
const careerSteps = [
  "Sales Trainee I",
  "Sales Trainee II",
  "Sales Consultant",
  "Sales Manager",
  "Sales Director",
  "Vice President",
  "Senior Vice President"
]

function getNextRole(currentRole) {
  const index = careerSteps.indexOf(currentRole)
  if (index === -1 || index === careerSteps.length - 1) return null
  return careerSteps[index + 1]
}

// --- Hilfsfunktion: aktuelle Quartalsmonate ---
function getCurrentQuarterMonths() {
  const now = new Date()
  const month = now.getMonth() // 0–11
  const year = now.getFullYear()

  const quarters = [
    ["Januar", "Februar", "März"],
    ["April", "Mai", "Juni"],
    ["Juli", "August", "September"],
    ["Oktober", "November", "Dezember"]
  ]

  const quarterIndex = Math.floor(month / 3)
  return quarters[quarterIndex].map(m => `${m} ${year}`)
}

// --- Sollwerte pro Beförderung ---
const promotionCriteria = {
  "Sales Trainee II": {
    eigenEH: 150,
    gesamtEH: null,
    quarterEH: [],
    minDirectEmployees: {}
  },
  "Sales Consultant": {
    eigenEH: 500,
    gesamtEH: null,
    quarterEH: [],
    minDirectEmployees: {}
  },
  "Sales Manager": {
    eigenEH: 700,
    gesamtEH: 1500,
    quarterEH: [500, 500, 500],
    minDirectEmployees: { "Sales Consultant": 2, "Sales Trainee II": 2 }
  },
  "Sales Director": {
    eigenEH: 700,
    gesamtEH: 6000,
    quarterEH: [1500, 1500, 1500],
    minDirectEmployees: { "Sales Manager": 1, "Sales Consultant": 2 }
  },
  "Vice President": {
    eigenEH: 700,
    gesamtEH: 20000,
    quarterEH: [5000, 5000, 5000],
    minDirectEmployees: { "Sales Director": 1, "Sales Manager": 2 }
  },
  "Senior Vice President": {
    eigenEH: 700,
    gesamtEH: 50000,
    quarterEH: [12000, 12000, 12000],
    minDirectEmployees: { "Vice President": 1, "Sales Director": 2 }
  }
}


export default function CareerPage() {
  const [user, setUser] = useState(null)
  const [careerData, setCareerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCareerData() {
      try {
        setLoading(true)
        const { data: authUser } = await supabase.auth.getUser()
        if (!authUser) throw new Error("Bitte einloggen")
        console.log("[Log] User Email: –", authUser.user.email)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.user.email)
          .single()

        if (userError || !userData) throw new Error("User in users table nicht gefunden")
        console.log("[Log] User Data: –", userData)
        setUser(userData)

        // --- Direkte Mitarbeiter laden ---
        const { data: directTeam } = await supabase
          .from('users')
          .select('id, role')
          .eq('leader', userData.id)

        const directByRole = {}
        directTeam?.forEach(member => {
          const role = member.role
          // Zähle nur, wenn diese Rolle in minDirectEmployees gefordert wird
          const nextRole = getNextRole(userData.role)
          const criteria = promotionCriteria[nextRole] || {}
          if (criteria.minDirectEmployees?.[role] !== undefined) {
            directByRole[role] = (directByRole[role] || 0) + 1
          }
        })

        // --- Team für Vertragsberechnung (direkt + indirekt) ---
        async function getTeamIds(userId) {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('leader', userId)
          if (error) throw error
          let ids = data.map(u => u.id)
          for (const id of ids) {
            const subIds = await getTeamIds(id)
            ids = ids.concat(subIds)
          }
          return ids
        }

        const teamIds = await getTeamIds(userData.id)
        console.log("[Log] Team IDs: –", teamIds)

        const { data: contracts, error: contractError } = await supabase
          .from('contracts')
          .select('eh, sent_at, user_id')
          .in('user_id', [userData.id, ...teamIds])
        if (contractError) throw contractError
        console.log("[Log] Contracts: –", contracts)

        const eigenEH = contracts?.filter(c => c.user_id === userData.id)
          .reduce((sum, c) => sum + Number(c.eh), 0) || 0

        const gesamtEH = contracts?.reduce((sum, c) => sum + Number(c.eh), 0) || 0

        const months = getCurrentQuarterMonths()
        const now = new Date()
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const quarterEH = [0, 0, 0]

        contracts?.forEach(c => {
          const sentDate = new Date(c.sent_at)
          const sentQuarter = Math.floor(sentDate.getMonth() / 3)
          if (sentQuarter === currentQuarter) {
            const monthIndex = sentDate.getMonth() % 3
            quarterEH[monthIndex] += Number(c.eh)
          }
        })

        setCareerData({
          eigenEH,
          gesamtEH,
          quarterEH,
          months,
          teamCount: directTeam?.length || 0,
          directByRole
        })
        setLoading(false)
      } catch (err) {
        console.error("[Error] Error fetching career data: –", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCareerData()
  }, [])

  if (loading) return <p className="text-center mt-10 text-[#451a3d]">Lade Karriere...</p>
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>
  if (!careerData || !user) return <p className="text-center mt-10 text-[#451a3d]">Keine Karriere Daten verfügbar</p>

  const nextRole = getNextRole(user.role)
  const criteria = promotionCriteria[nextRole] || {}

  return (
    <div className="p-10 text-[#451a3d]">
      <h1 className="text-4xl font-bold mb-2 text-[#451a3d]">Deine Karriere</h1>
      <h2 className="text-xl font-semibold mb-8 text-[#451a3d]">
        Karriereplanung von {user.first_name} {user.last_name} zum {nextRole}
      </h2>

      <h3 className="text-2xl font-bold mb-4 text-[#451a3d]">Beförderungskriterien</h3>

      <div className="border border-[#451a3d]/40 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-sm sm:text-base">
          <tbody>
            {criteria.gesamtEH !== null || criteria.eigenEH !== null ? (
              <>
                <tr className="bg-[#451a3d]/10">
                  <td colSpan="2" className="p-3 font-semibold text-[#451a3d]">Historische Werte</td>
                </tr>
                {criteria.gesamtEH !== null && (
                  <tr className="border-b border-[#451a3d]/30">
                    <td className="p-3">{criteria.gesamtEH.toLocaleString('de-DE')} EH Gesamtproduktion historisch</td>
                    <td className="p-3 text-right font-medium">{careerData.gesamtEH.toLocaleString('de-DE')} EH</td>
                  </tr>
                )}
                {criteria.eigenEH !== null && (
                  <tr className="border-b border-[#451a3d]/30">
                    <td className="p-3">{criteria.eigenEH.toLocaleString('de-DE')} EH Eigenproduktion historisch</td>
                    <td className="p-3 text-right font-medium">{careerData.eigenEH.toLocaleString('de-DE')} EH</td>
                  </tr>
                )}
              </>
            ) : null}

            {criteria.quarterEH && criteria.quarterEH.length > 0 && (
              <>
                <tr className="bg-[#451a3d]/10">
                  <td colSpan="2" className="p-3 font-semibold text-[#451a3d]">
                    Produktion letztes Quartal – mindestens 3 x {criteria.quarterEH[0].toLocaleString('de-DE')} EH
                  </td>
                </tr>
                {careerData.months.map((month, i) => (
                  <tr key={i} className="border-b border-[#451a3d]/30">
                    <td className="p-3">{month}</td>
                    <td className="p-3 text-right font-medium">{careerData.quarterEH[i].toLocaleString('de-DE')} EH</td>
                  </tr>
                ))}
              </>
            )}

            {criteria.minDirectEmployees && Object.keys(criteria.minDirectEmployees).length > 0 && (
              <>
                <tr className="bg-[#451a3d]/10">
                  <td colSpan="2" className="p-3 font-semibold text-[#451a3d]">Direkt unterstellte Mitarbeiter</td>
                </tr>
                {Object.entries(criteria.minDirectEmployees).map(([role, required], idx) => (
                  <tr key={idx} className="border-b border-[#451a3d]/30">
                    <td className="p-3">{required} {role}</td>
                    <td className="p-3 text-right font-medium">
                      {careerData.directByRole?.[role] || 0} / {required}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-[#451a3d]/70 mt-6">
        Stand: {new Date().toLocaleDateString('de-DE')}
      </p>
    </div>
  )
}
