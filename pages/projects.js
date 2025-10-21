import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [usersMap, setUsersMap] = useState({})
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: authUserData } = await supabase.auth.getUser()
      if (!authUserData?.user) return
      const authEmail = authUserData.user.email

      const { data: currentUserData } = await supabase
        .from('users')
        .select('id, leader')
        .eq('email', authEmail)
        .single()
      if (!currentUserData) return

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
    }

    fetchProjects()
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

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-[#451a3d] mb-2">Projekte</h1>
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
    </div>
  )
}
