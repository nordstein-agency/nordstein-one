import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// 💡 Konstante für die Liste aller möglichen Leistungen (unverändert) 💡
const serviceOptions = [
    { key: 'web_big', label: 'Webdesign: Groß (E-Commerce, Konzernseiten)', category: 'Webdesign' },
    { key: 'web_medium', label: 'Webdesign: Mittel (Große Portfolio Seiten mit Buchungstool und Abfragen von anderen Websites, etc.)', category: 'Webdesign' },
    { key: 'web_small', label: 'Webdesign: Klein (Portfolio seite, mit sehr einfachen technischen features, wie z.B. Calendly, Forms, etc)', category: 'Webdesign' },
    { key: 'Wordpress', label: 'Webdesign: Verwaltung und Hosting Wordpress', category: 'Webdesign' },
    { key: 'booking_tool', label: 'Webdesign: Buchungstool online', category: 'Webdesign' },
    
    { key: 'videoshoot_full', label: 'Content: Drehtag inkl. Nachbearbeitung', category: 'Content Creation' },
    { key: 'videoshoot_half', label: 'Content: Halber Drehtag inkl. Nachbearbeitung', category: 'Content Creation' },
    { key: 'production_full', label: 'Content: Postproduktion Tagessatz (Video Groß)', category: 'Content Creation' },
    { key: 'production_half', label: 'Content: Postproduktion Halbtagessatz (Video Klein)', category: 'Content Creation' },
    { key: 'fotoshoot_full', label: 'Content: Fotoshooting inkl. Nachbearbeitung Tag', category: 'Content Creation' },
    { key: 'fotoshoot_half', label: 'Content: Fotoshooting inkl. Nachbearbeitung halber Tag', category: 'Content Creation' },
    { key: 'logo', label: 'Content: Logo Design', category: 'Content Creation' },
    { key: 'social_small', label: 'Content: Social Grafik (1-5 Stück)', category: 'Content Creation' },
    { key: 'social_big', label: 'Content: Social Grafik (5-10 Stück)', category: 'Content Creation' },
    { key: 'graphic_ad', label: 'Content: Werbegrafik Einzelstück', category: 'Content Creation' },
    
    { key: 'setup_big', label: 'Online Marketing: Set Up Tracking Groß (E-Com)', category: 'Online Marketing' },
    { key: 'setup_small', label: 'Online Marketing: Set up Tracking klein (Standart Events)', category: 'Online Marketing' },
    { key: 'campaign_small', label: 'Online Marketing: Kampagnenverwaltung Monatlich klein', category: 'Online Marketing' },
    { key: 'campaign_medium', label: 'Online Marketing: Kampagnenverwaltung Monatlich mittel', category: 'Online Marketing' },
    { key: 'campaign_big', label: 'Online Marketing: Kampagnenverwaltung Monatlich Groß', category: 'Online Marketing' },
    { key: 'seo_small', label: 'Online Marketing: SEO klein (local Seo)', category: 'Online Marketing' },
    { key: 'seo_medium', label: 'Online Marketing: SEO mittel (Beratung, pro Seite)', category: 'Online Marketing' },
    { key: 'seo_big', label: 'Online Marketing: SEO groß (Done for you, pro Seite)', category: 'Online Marketing' },
    { key: 'mail_big', label: 'Online Marketing: E-Mail Fluss/Newsletter Kampagnen Groß', category: 'Online Marketing' },
    { key: 'mail_small', label: 'Online Marketing: E-Mail Fluss/Newsletter Kampagnen klein', category: 'Online Marketing' },
    { key: 'wa_small', label: 'Online Marketing: Whatsapp Kampagnen klein', category: 'Online Marketing' },
    { key: 'wa_big', label: 'Online Marketing: Whatsapp Kampagnen groß', category: 'Online Marketing' },
];

// Funktion zur Generierung der laufenden Partner ID (P000001, P000002, ...) (unverändert)
async function generatePartnerId() {
    const { data, error } = await supabase
        .from('partners')
        .select('partner_id')
        .order('partner_id', { ascending: false })
        .limit(1)
        .maybeSingle();

    let nextNumber = 1;

    if (data && data.partner_id) {
        const currentNumber = parseInt(data.partner_id.substring(1), 10);
        if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
        }
    }

    return `P${String(nextNumber).padStart(6, '0')}`;
}


// Anfang der Modal-Komponente für das Anlegen neuer Partner
const PartnerModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    adress: '',
    contact_person: '',
  })
  // Zustand für die ausgewählten Leistungen und deren Preise
  const [servicesData, setServicesData] = useState({}); // { web_big: '1200.00', ... }

  const [loading, setLoading] = useState(false)
  const [partnerIdPreview, setPartnerIdPreview] = useState('wird generiert...')

  // Bei Öffnen des Modals, sofort die nächste Partner-ID generieren
  useEffect(() => {
    if (isOpen) {
        generatePartnerId().then(id => setPartnerIdPreview(id));
        // Reset des Formulars beim Öffnen
        setFormData({ name: '', email: '', phone: '', adress: '', contact_person: '' });
        setServicesData({}); 
    }
  }, [isOpen]);


  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 🛠️ KORRIGIERT: Handler für Checkbox und Preiseingabe
  const handleServiceChange = (key, value, isCheckbox) => {
    setServicesData(prev => {
        const newState = { ...prev };
        
        if (isCheckbox) {
            if (value) {
                // Checkbox aktiviert: Füge Key hinzu mit leerem String als initialen Preis
                newState[key] = newState[key] === undefined ? '' : newState[key]; 
            } else {
                // Checkbox deaktiviert: Entferne Key komplett
                delete newState[key];
            }
        } else {
            // Preis geändert: Wert aktualisieren
            newState[key] = value;
        }
        return newState;
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const authEmail = formData.email 
    
    if (!formData.name || !authEmail) {
        alert('Name und E-Mail sind erforderlich.')
        setLoading(false)
        return
    }

    // Prüfen, ob für ausgewählte Services Preise eingegeben wurden
    const incompleteServices = Object.keys(servicesData).filter(key => 
        servicesData[key] === '' || isNaN(parseFloat(servicesData[key]))
    );
    
    if (incompleteServices.length > 0) {
        alert(`Bitte geben Sie gültige Preise für alle ausgewählten Leistungen ein.`);
        setLoading(false);
        return;
    }


    // 1. Generiere die finale Partner ID
    const newPartnerId = await generatePartnerId();

    // 2. Erstelle Array für die agency_prices Tabelle
    const pricesToInsert = Object.keys(servicesData)
        .map(key => ({
            service: key,
            price: parseFloat(servicesData[key]),
        }));


    try {
        // A. Auth-User erstellen
        const apiResponse = await fetch('/api/create-auth-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail }),
        })

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json()
            throw new Error(errorData.error || 'Fehler beim Erstellen des Auth-Users.')
        }
        
        // B. Partner in der 'partners' Tabelle speichern und UUID abrufen
        const partnerData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            adress: formData.adress,
            contact_person: formData.contact_person,
            partner_id: newPartnerId,
        }

        const { data: insertedPartner, error: partnerError } = await supabase
            .from('partners')
            .insert([partnerData]) 
            .select('id') // WICHTIG: Hole die UUID (PK) zurück!
            .single()

        if (partnerError) throw partnerError
        if (!insertedPartner) throw new Error("Partner wurde nicht gespeichert oder ID fehlt.");
        
        const partnerUUID = insertedPartner.id;

        // C. Preise in der 'agency_prices' Tabelle speichern
        if (pricesToInsert.length > 0) {
            const pricesWithId = pricesToInsert.map(p => ({
                ...p,
                partner_id: partnerUUID 
            }));

            const { error: pricesError } = await supabase
                .from('agency_prices')
                .insert(pricesWithId);

            if (pricesError) {
                console.error('Warnung: Fehler beim Speichern der Agenturpreise:', pricesError);
            }
        }


        // D. Eintrag in der 'users' Tabelle speichern
        const userData = {
            first_name: formData.name,      
            email: formData.email, 
            phone: formData.phone,           
            office_adress: formData.adress,  
            role: "Partner", 
        }

        const { error: userError } = await supabase
            .from('users')
            .insert([userData])
            .select()

        if (userError) {
            console.error('Warnung: Fehler beim Speichern in der users Tabelle:', userError);
        }


        alert(`Partner "${formData.name}" (ID: ${newPartnerId}) wurde erfolgreich angelegt.`)
        
        // Modal schließen und Formular zurücksetzen
        setFormData({ name: '', email: '', phone: '', adress: '', contact_person: '' })
        setServicesData({});
        onClose()
        
    } catch (error) {
        console.error('Fehler beim Anlegen des Partners:', error)
        alert(`Fehler beim Anlegen des Partners: ${error.message}`)
    } finally {
        setLoading(false)
    }
  }


  // Gruppierung der Leistungen nach Kategorie (unverändert)
  const groupedServices = serviceOptions.reduce((acc, service) => {
    acc[service.category] = acc[service.category] || [];
    acc[service.category].push(service);
    return acc;
  }, {});


  return (
    // Modal-Stil: Tailwind Klassen
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 max-w-2xl w-full rounded-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-2xl font-bold text-[#451a3d] mb-6">Neuen Partner anlegen</h3>
        
        <form onSubmit={handleSubmit}>
          
          {/* Allgemeine Partnerdaten (unverändert) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
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
          
          {/* Automatisch generierte ID (unverändert) */}
          <div className="mb-6 bg-[#f5f0f7] p-3 rounded-lg">
            <label className="block text-gray-700 text-sm font-bold mb-1">Partner-ID</label>
            <p className="text-lg text-[#451a3d] font-semibold">{partnerIdPreview}</p>
          </div>

          <hr className="my-6 border-gray-200" />
          
          {/* Leistungen und Preise */}
          <h4 className="text-xl font-bold text-[#6b3c67] mb-4">Leistungen und Preise der Agentur</h4>

          {Object.keys(groupedServices).map(category => (
            <div key={category} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h5 className="text-lg font-semibold text-[#451a3d] mb-3">{category}</h5>
                {groupedServices[category].map(service => (
                    <div key={service.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        
                        {/* Checkbox und Label */}
                        <div className="flex items-center flex-grow mr-4">
                            <input
                                type="checkbox"
                                id={service.key}
                                // 💡 KORRIGIERT: Prüfe auf Existenz des Keys, nicht nur auf Truthy-Wert des Preises
                                checked={service.key in servicesData}
                                onChange={(e) => handleServiceChange(service.key, e.target.checked, true)}
                                className="h-4 w-4 text-[#451a3d] border-gray-300 rounded focus:ring-[#451a3d]"
                            />
                            <label htmlFor={service.key} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                                {service.label}
                            </label>
                        </div>

                        {/* Preiseingabe (erscheint nur bei Check) */}
                        {/* 💡 KORRIGIERT: Prüfe auf Existenz des Keys */}
                        {service.key in servicesData && (
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Preis"
                                    value={servicesData[service.key] || ''}
                                    onChange={(e) => handleServiceChange(service.key, e.target.value, false)}
                                    // 💡 HINZUGEFÜGT: required, damit leere Preise abgefangen werden
                                    required 
                                    className="w-24 p-1 text-sm border rounded focus:ring-1 focus:ring-[#451a3d] text-right"
                                />
                                <span className="ml-2 text-sm text-gray-500">€</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          ))}

          {/* Buttons (unverändert) */}
          <div className="flex justify-end gap-3 mt-6">
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


// -----------------------------------------------------------------------------
// Hauptkomponente Projects (unverändert)
// -----------------------------------------------------------------------------
export default function Projects() {
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [usersMap, setUsersMap] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false) 
  const [userRole, setUserRole] = useState(null)
  const [loadingInitial, setLoadingInitial] = useState(true)

  useEffect(() => {
    const fetchProjectsAndUserRole = async () => {
      setLoadingInitial(true)

      const { data: authUserData } = await supabase.auth.getUser()
      if (!authUserData?.user) {
        setLoadingInitial(false)
        return
      }
      const authEmail = authUserData.user.email

      // 1. Benutzerdaten (inkl. Rolle) abrufen
      const { data: currentUserData } = await supabase
        .from('users')
        .select('id, leader, role')
        .eq('email', authEmail)
        .single()
      
      if (currentUserData) {
        setUserRole(currentUserData.role)
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
      setLoadingInitial(false)
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