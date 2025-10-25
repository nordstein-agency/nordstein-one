import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Anfang der Modal-Komponente für das Anlegen neuer Partner (BLEIBT UNVERÄNDERT)
const PartnerModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    adress: '',
    contact_person: '',
    partner_id: '',
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Daten für die 'partners' Tabelle
    const partnerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      adress: formData.adress,
      contact_person: formData.contact_person,
      partner_id: formData.partner_id,
    }

    const authEmail = formData.email 
    
    if (!partnerData.name || !authEmail) {
        alert('Name und E-Mail sind erforderlich.')
        setLoading(false)
        return
    }

    try {
        // 1. Auth-User erstellen und E-Mail senden (über API Route)
        const apiResponse = await fetch('/api/create-auth-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail }),
        })

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json()
            throw new Error(errorData.error || 'Fehler beim Erstellen des Auth-Users.')
        }

        // 2. Partner in der 'partners' Tabelle speichern
        const { error: partnerError } = await supabase
            .from('partners')
            .insert([partnerData]) // Speichert in Ihrer 'partners' Tabelle
            .select()

        if (partnerError) throw partnerError

        alert(`Partner "${partnerData.name}" wurde angelegt und die E-Mail zum Passwort setzen wurde an ${authEmail} gesendet.`)
        
        // Modal schließen und Formular zurücksetzen
        setFormData({
            name: '',
            email: '',
            phone: '',
            adress: '',
            contact_person: '',
            partner_id: '',
        })
        onClose()
        
    } catch (error) {
        console.error('Fehler beim Anlegen des Partners:', error)
        alert(`Fehler beim Anlegen des Partners: ${error.message}`)
    } finally {
        setLoading(false)
    }
  }


  return (
    // Modal-Stil: Tailwind Klassen
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 max-w-lg w-full rounded-lg shadow-2xl">
        <h3 className="text-2xl font-bold text-[#451a3d] mb-6">Neuen Partner anlegen</h3>
        
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name*</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">E-Mail* (für Login)</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="partner_id">Partner-ID</label>
            <input 
              type="text" 
              name="partner_id" 
              id="partner_id" 
              value={formData.partner_id} 
              onChange={handleChange} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact_person">Ansprechpartner</label>
            <input 
              type="text" 
              name="contact_person" 
              id="contact_person" 
              value={formData.contact_person} 
              onChange={handleChange} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adress">Adresse</label>
            <input 
              type="text" 
              name="adress" 
              id="adress" 
              value={formData.adress} 
              onChange={handleChange} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">Telefon</label>
            <input 
              type="tel" 
              name="phone" 
              id="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#451a3d]"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 font-medium rounded-none hover:bg-gray-400 disabled:opacity-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-[#451a3d] text-white px-4 py-2 font-medium rounded-none hover:bg-[#5e2a56] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Speichern...' : 'Partner speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
// Ende der Modal-Komponente


export default function Projects() {
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [usersMap, setUsersMap] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false) 
  const [userRole, setUserRole] = useState(null) // NEU: State für die Rolle des eingeloggten Benutzers
  const [loadingInitial, setLoadingInitial] = useState(true) // NEU: Lade-State für die initiale Rolle

  useEffect(() => {
    const fetchProjectsAndUserRole = async () => {
      setLoadingInitial(true) // Setzen des Lade-States

      const { data: authUserData } = await supabase.auth.getUser()
      if (!authUserData?.user) {
        setLoadingInitial(false)
        return
      }
      const authEmail = authUserData.user.email

      // 1. Benutzerdaten (inkl. Rolle) abrufen
      const { data: currentUserData } = await supabase
        .from('users')
        .select('id, leader, role') // WICHTIG: role hinzufügen
        .eq('email', authEmail)
        .single()
      
      if (currentUserData) {
        setUserRole(currentUserData.role) // Rolle speichern
      } else {
        setUserRole(null)
      }

      if (!currentUserData) {
        setLoadingInitial(false)
        return
      }
      
      // 2. Projekt-Lade-Logik (wie gehabt)
      const getSubordinates = async (userId) => {
        const { data } = await supabase.from('users').select('id').eq('leader', userId)
        return data?.map((u) => u.id) || []
      }

      const userIds = [currentUserData.id]
      const level1 = await getSubordinates(currentUserData.id)
      userIds.push(...level1)
      for (const id of level1) {
        const level2 = await getSubordinates(id)
        userIds.push(...level2)
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .in('user_id', userIds)
      if (!projectsData || projectsData.length === 0) {
        setProjects([])
        setLoadingInitial(false)
        return
      }

      const customerIds = [...new Set(projectsData.map((p) => p.customer_id))].filter(Boolean)
      let customerMap = {}
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds)
        customersData?.forEach((c) => {
          customerMap[c.id] = c.name
        })
      }

      const userIdsSet = [...new Set(projectsData.map((p) => p.user_id))].filter(Boolean)
      let usersMapTemp = {}
      if (userIdsSet.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIdsSet)
        usersData?.forEach((u) => {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim()
          usersMapTemp[u.id] = fullName || '-'
        })
      }
      setUsersMap(usersMapTemp)

      const finalProjects = projectsData.map((p) => ({
        ...p,
        customer_name: customerMap[p.customer_id] || '-',
        tarif: p.title,
        status: p.status || 'Offen',
        price: p.max_price,
        user_name: usersMapTemp[p.user_id] || '-'
      }))
      setProjects(finalProjects)
      setLoadingInitial(false) // Beenden des Lade-States
    }

    fetchProjectsAndUserRole()
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter ? project.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const handleClose = () => setSelectedProject(null)

  const handleDownload = async () => {
  if (!selectedProject) return

  const response = await fetch(`/api/download-onboarding?projectId=${selectedProject.id}`)
  if (!response.ok) {
    alert('Fehler beim Herunterladen der Datei.')
    return
  }
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `onboarding_${selectedProject.tarif || 'Projekt'}.pdf`
  a.click()
  window.URL.revokeObjectURL(url)
}


  const handleTakeOver = () => {
    alert(`Projekt "${selectedProject.tarif}" wurde übernommen.`)
  }

  // Funktionen zum Öffnen/Schließen des neuen Partner-Modals
  const handleOpenPartnerModal = () => setIsPartnerModalOpen(true)
  const handleClosePartnerModal = () => setIsPartnerModalOpen(false)

  if (loadingInitial) return <div className="max-w-6xl mx-auto py-12 px-6">Lädt...</div>


  // Bedingung zur Anzeige des Buttons
  const showPartnerButton = userRole === 'Geschäftsführung'

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-[#451a3d]">Projekte</h1>
        
        {/* BEDINGTE ANZEIGE DES BUTTONS */}
        {showPartnerButton && (
          <button
            onClick={handleOpenPartnerModal}
            className="bg-[#451a3d] text-white px-4 py-2 font-medium border-0 outline-none shadow-none hover:bg-[#5e2a56] focus:outline-none"
            style={{ fontFamily: 'Inter Tight, Inter, system-ui, sans-serif' }}
          >
            Neuen Partner anlegen
          </button>
        )}
      </div>

      <p className="text-[#6b3c67] mb-8">Hier findest du alle aktuellen Projekte im Überblick.</p>

      {/* Suchfeld + Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder="Nach Kunde suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full sm:max-w-sm focus:outline-none focus:ring-2 focus:ring-[#451a3d]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-4 py-2 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[#451a3d]"
        >
          <option value="">Alle Status</option>
          <option value="Offen">Offen</option>
          <option value="Übernommen">Übernommen</option>
          <option value="Abgeschlossen">Abgeschlossen</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto bg-white border border-gray-200">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-[#f5f0f7]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#451a3d] uppercase tracking-wider">Kunde</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#451a3d] uppercase tracking-wider">Tarif</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#451a3d] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#451a3d] uppercase tracking-wider">Preis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-[#faf7fb] cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <td className="px-6 py-4 text-sm text-gray-700">{project.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.tarif}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{project.price ? `${project.price} €` : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-500 italic">
                  Noch keine Projekte vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detailansicht */}
      {selectedProject && (
        <div className="mt-8 bg-[#faf7fb] p-6 border border-gray-200">
          {/* 2 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Linke Spalte: Projektdetails */}
            <div>
              <h2 className="text-2xl font-bold text-[#451a3d] mb-4">Projekt Details</h2>
              <p><strong>Kunde:</strong> {selectedProject.customer_name}</p>
              <p><strong>Betreuer:</strong> {selectedProject.user_name}</p>
              <p><strong>Tarif:</strong> {selectedProject.tarif}</p>
              <p><strong>Status:</strong> {selectedProject.status}</p>
              <p><strong>Preis:</strong> {selectedProject.price ? `${selectedProject.price} €` : '-'}</p>
            </div>

            {/* Rechte Spalte: Benötigte Leistungen */}
            <div>
              <h2 className="text-2xl font-bold text-[#451a3d] mb-4">Benötigte Leistung</h2>
              <p className="text-gray-700 italic">– wird später von der Partneragentur ergänzt –</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="bg-[#6b3c67] text-white px-5 py-2 font-medium border-none outline-none"
              style={{
                boxShadow: 'none',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#7e4a76')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#6b3c67')}
            >
              Schließen
            </button>

            <button
              onClick={handleDownload}
              className="bg-[#8b5c87] text-white px-5 py-2 font-medium border-none outline-none"
              style={{
                boxShadow: 'none',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#9d6a99')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#8b5c87')}
            >
              Download Details
            </button>

            <button
              onClick={handleTakeOver}
              className="bg-[#451a3d] text-white px-5 py-2 font-medium border-none outline-none"
              style={{
                boxShadow: 'none',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#5e2a56')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#451a3d')}
            >
              Übernehmen
            </button>
          </div>
        </div>
      )}

      {/* Das Modal für das Anlegen von Partnern wird hier gerendert */}
      <PartnerModal 
          isOpen={isPartnerModalOpen} 
          onClose={handleClosePartnerModal} 
      />
    </div>
  )
}