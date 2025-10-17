/*import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user))
  }, [])

  if (!user) return <div>Lädt...</div>

  return (

    <div className="p-4">
      <h1 className="nav-link">Profil</h1>


      <p>Name: {user.user_metadata?.full_name || '-'}</p>
      <p>Email: {user.email}</p>
      

    </div>

)
}
*/




import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [customUser, setCustomUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      // 1️⃣ Aktuellen Auth-User abrufen
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        setLoading(false)
        return
      }
      setUser(authUser)

      // 2️⃣ Custom User aus der "users" Tabelle abrufen
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

  if (loading) return <div>Lädt...</div>
  if (!customUser) return <div>Benutzerdaten nicht gefunden</div>

  return (

      <div className="p-4">
        <h1 className="nav-link mb-4">Profil</h1>

        <div className="grid grid-cols-3 gap-8">
          {/* Spalte 1 */}
          <div>
            <p><strong>Name:</strong> {customUser.first_name} {customUser.last_name}</p>
            <p><strong>Position:</strong> {customUser.role || '-'}</p>
            <p><strong>Vermittlernummer:</strong> {customUser.nordstein_id || '-'}</p>
            <p><strong>Führungskraft:</strong> {customUser.leader || '-'}</p>
            <p><strong>Adresse:</strong> {customUser.adress || '-'}</p>
          </div>

          {/* Spalte 2 */}
          <div>
            <p><strong>Büroadresse:</strong> {customUser.office_adress || '-'}</p>
            <p><strong>E-Mail privat:</strong> {customUser.email || '-'}</p>
            <p><strong>E-Mail geschäftlich:</strong> {customUser.business_email || '-'}</p>
            <p><strong>Telefon:</strong> {customUser.phone || '-'}</p>
            <p><strong>Geburtsdatum:</strong> {customUser.birth_date || '-'}</p>
          </div>

          {/* Spalte 3 */}
          <div>
            <p><strong>Bank:</strong> {customUser.bank_name || '-'}</p>
            <p><strong>IBAN:</strong> {customUser.iban || '-'}</p>
            <p><strong>BIC:</strong> {customUser.bic || '-'}</p>
            <p><strong>SV-Nr.:</strong> {customUser.sv_nr || '-'}</p>
          </div>
        </div>
      </div>

  )
}
