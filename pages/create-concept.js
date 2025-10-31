
/*

// pages/create-concept.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function CreateConcept() {
  const router = useRouter()
  const { customerId } = router.query
  const [customer, setCustomer] = useState(null)
  const [templates, setTemplates] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [selectedConcept, setSelectedConcept] = useState('Starter')
  const [loading, setLoading] = useState(true)

  // 🔹 Kunde laden
  useEffect(() => {
    if (!customerId) return
    const fetchCustomer = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, user_id')
        .eq('id', customerId)
        .single()
      if (error) console.error('Fehler beim Laden des Kunden:', error)
      else setCustomer(data)
    }
    fetchCustomer()
  }, [customerId])

  // 🔹 Vorlagen laden
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase.storage
        .from('concept_templates')
        .list('contract_templates', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error("Fehler beim Laden der Templates:", error)
        setTemplates([])
        setLoading(false)
        return
      }

      const cleaned =
        data?.filter((f) => f.name?.endsWith('.pdf')).map((f) => f.name.replace('.pdf', '')) || []

      setTemplates(cleaned)
      setLoading(false)
    }

    fetchTemplates()
  }, [])

  // 🔹 Checkbox toggeln
  const toggleDoc = (name) => {
    setSelectedDocs((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    )
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">Lädt...</div>
  }


// 🔹 Hauptfunktion
const handleCreate = async () => {
  try {
    if (!customer) {
      alert('Kunde nicht gefunden.')
      return
    }

    if (selectedDocs.length === 0) {
      alert('Bitte mindestens ein Dokument auswählen!')
      return
    }

    // 1️⃣ Datei(en) in PCloud hochladen
    const uploadRes = await fetch('/api/add-customer-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customer.name,
        files: selectedDocs,
      }),
    })

    const uploadResult = await uploadRes.json()
    if (!uploadRes.ok) throw new Error(uploadResult.message)
    console.log('✅ Upload abgeschlossen:', uploadResult)

    const uploadedFile = uploadResult.uploadedFiles[0]
    const folderId = uploadResult.folderId
    const fullDocumentName = uploadedFile + '.pdf'

    console.log('📂 Datei-Infos:', { uploadedFile, folderId })

    // 2️⃣ Stabilen, serverseitigen Direktlink über neue API holen
    const directRes = await fetch(
      `/api/get-direct-link?path=${encodeURIComponent(
        `/customers/${customer.name}/${fullDocumentName}`
      )}`
    )

    if (!directRes.ok) {
      const errText = await directRes.text()
      console.error('❌ /api/get-direct-link fehlgeschlagen:', errText)
      alert('Fehler beim Erzeugen des direkten Download-Links.')
      return
    }

    const directData = await directRes.json()
    if (!directData.ok || !directData.directUrl) {
      console.error('❌ Ungültige Antwort von get-direct-link:', directData)
      alert('Fehler beim Erzeugen des direkten Download-Links (2).')
      return
    }

    const fileUrlFinal = directData.directUrl
    console.log('🔗 Stabiler Direktlink (CDN-Link):', fileUrlFinal)

    // 3️⃣ Vertrag in Supabase anlegen
    const { data: contractData, error: insertError } = await supabase
      .from('contracts')
      .insert([
        {
          tarif: selectedConcept,
          customer_id: customer.id,
          user_id: customer.user_id,
          state: 'Antrag',
          //pdf_url: fileUrlFinal,
          pdf_url: `/customers/${customer.name}/${fullDocumentName}`,
          document_name: fullDocumentName,
        },
      ])
      .select('id')
      .single()

    if (insertError) throw insertError
    console.log('📦 Neuer Vertrag erstellt:', contractData)

    // 4️⃣ PDF-Editor öffnen
    const editorUrl = `/pdf-editor?customerId=${customer.id}&customerName=${encodeURIComponent(
      customer.name
    )}&folderId=${folderId}&documentName=${encodeURIComponent(fullDocumentName)}`
    window.open(editorUrl, '_blank')
  } catch (err) {
    console.error('❌ Fehler in create-concept:', err)
    alert(`Fehler beim Erstellen des Konzepts:\n${err?.message || err}`)
  }
}







  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Konzepterstellung</h1>
        <button
          onClick={() => router.push(`/customers?customerId=${customer?.id || ''}`)}
          className="bg-[#451a3d] text-white px-6 py-2 rounded-none hover:bg-[#6b3c67] transition-all focus:outline-none border-none"
        >
          Zum Kundenprofil
        </button>
      </div>

      {customer && (
        <p className="mb-4 text-[#6b3c67]">
          <strong>Kunde:</strong> {customer.name}
        </p>
      )}

      <div className="mb-6 max-w-xs">
        <label className="block mb-2 font-semibold text-[#451a3d]">Konzept wählen</label>
        <select
          value={selectedConcept}
          onChange={(e) => setSelectedConcept(e.target.value)}
          className="w-full bg-[#f9f7f8] text-[#451a3d] border border-[#d9c8d5] py-2 px-3 focus:ring-2 focus:ring-[#451a3d]"
        >
          <option value="Starter">Starter</option>
          <option value="Essential">Essential</option>
          <option value="Professional">Professional</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Dokumentenvorlagen</label>
        <div className="flex flex-col gap-2 border border-gray-200 rounded p-4 bg-white">
          {templates.length === 0 ? (
            <p className="text-gray-500 italic">Keine Vorlagen gefunden.</p>
          ) : (
            templates.map((template) => (
              <label key={template} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(template)}
                  onChange={() => toggleDoc(template)}
                  className="accent-[#451a3d]"
                />
                <span>{template}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="bg-[#451a3d] text-white px-6 py-2 hover:bg-[#6b3c67] transition-all"
        >
          Dokumente hinzufügen
        </button>
      </div>
    </div>
  )
}

*/



// pages/create-concept.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function CreateConcept() {
  const router = useRouter()
  const { customerId } = router.query
  const [customer, setCustomer] = useState(null)
  const [templates, setTemplates] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [selectedConcept, setSelectedConcept] = useState('Starter')
  const [loading, setLoading] = useState(true)

  // 🆕 Neue States für Services
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])

  // 🔹 Kunde laden
  useEffect(() => {
    if (!customerId) return
    const fetchCustomer = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, user_id')
        .eq('id', customerId)
        .single()
      if (error) console.error('Fehler beim Laden des Kunden:', error)
      else setCustomer(data)
    }
    fetchCustomer()
  }, [customerId])

  // 🔹 Vorlagen laden
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase.storage
        .from('concept_templates')
        .list('contract_templates', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (error) {
        console.error("Fehler beim Laden der Templates:", error)
        setTemplates([])
        setLoading(false)
        return
      }

      const cleaned =
        data?.filter((f) => f.name?.endsWith('.pdf')).map((f) => f.name.replace('.pdf', '')) || []

      setTemplates(cleaned)
      setLoading(false)
    }

    fetchTemplates()
  }, [])

  // 🆕 Services aus Supabase laden
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('title, description')

      if (error) {
        console.error('Fehler beim Laden der Services:', error)
        return
      }

      setServices(data || [])
    }

    fetchServices()
  }, [])

  // 🔹 Checkbox toggeln (Dokumente)
  const toggleDoc = (name) => {
    setSelectedDocs((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    )
  }

  // 🆕 Checkbox toggeln (Services)
  const toggleService = (title) => {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">Lädt...</div>
  }

  // Kategorien-Definitionen (Mapping nach Titeln)
  const categories = {
    Webdesign: ['web_small', 'web_medium', 'web_big', 'wordpress', 'booking_tool'],
    'Content Creation': [
      'videoshoot_full', 'videoshoot_half',
      'production_full', 'production_half',
      'fotoshoot_full', 'fotoshoot_half',
      'logo', 'social_small', 'social_big', 'graphic_ad'
    ],
    'Online Marketing': [
      'setup_small', 'setup_big',
      'campaign_small', 'campaign_medium', 'campaign_big',
      'seo_small', 'seo_medium', 'seo_big',
      'mail_small', 'mail_big',
      'wa_small', 'wa_big'
    ],
  }

  // 🔹 Hauptfunktion bleibt gleich (kann später erweitert werden, um ausgewählte Services zu speichern)
  const handleCreate = async () => {
    try {
      if (!customer) {
        alert('Kunde nicht gefunden.')
        return
      }

      if (selectedDocs.length === 0) {
        alert('Bitte mindestens ein Dokument auswählen!')
        return
      }

      // Hier könnte später auch selectedServices mit in Supabase geschrieben werden
      console.log('🧩 Ausgewählte Services:', selectedServices)

      // 1️⃣ Datei(en) in PCloud hochladen
      const uploadRes = await fetch('/api/add-customer-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          files: selectedDocs,
        }),
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.message)
      console.log('✅ Upload abgeschlossen:', uploadResult)

      const uploadedFile = uploadResult.uploadedFiles[0]
      const folderId = uploadResult.folderId
      const fullDocumentName = uploadedFile + '.pdf'

      console.log('📂 Datei-Infos:', { uploadedFile, folderId })

      // 2️⃣ Stabilen, serverseitigen Direktlink über neue API holen
      const directRes = await fetch(
        `/api/get-direct-link?path=${encodeURIComponent(
          `/customers/${customer.name}/${fullDocumentName}`
        )}`
      )

      if (!directRes.ok) {
        const errText = await directRes.text()
        console.error('❌ /api/get-direct-link fehlgeschlagen:', errText)
        alert('Fehler beim Erzeugen des direkten Download-Links.')
        return
      }

      const directData = await directRes.json()
      if (!directData.ok || !directData.directUrl) {
        console.error('❌ Ungültige Antwort von get-direct-link:', directData)
        alert('Fehler beim Erzeugen des direkten Download-Links (2).')
        return
      }

      const fileUrlFinal = directData.directUrl
      console.log('🔗 Stabiler Direktlink (CDN-Link):', fileUrlFinal)

      // 3️⃣ Vertrag in Supabase anlegen
      const { data: contractData, error: insertError } = await supabase
        .from('contracts')
        .insert([
          {
            tarif: selectedConcept,
            customer_id: customer.id,
            user_id: customer.user_id,
            state: 'Antrag',
            pdf_url: `/customers/${customer.name}/${fullDocumentName}`,
            document_name: fullDocumentName,
            services_selected: selectedServices, // 🆕 optionales Feld, falls in DB vorhanden
          },
        ])
        .select('id')
        .single()

      if (insertError) throw insertError
      console.log('📦 Neuer Vertrag erstellt:', contractData)

      // 4️⃣ PDF-Editor öffnen
      const editorUrl = `/pdf-editor?customerId=${customer.id}&customerName=${encodeURIComponent(
        customer.name
      )}&folderId=${folderId}&documentName=${encodeURIComponent(fullDocumentName)}`
      window.open(editorUrl, '_blank')
    } catch (err) {
      console.error('❌ Fehler in create-concept:', err)
      alert(`Fehler beim Erstellen des Konzepts:\n${err?.message || err}`)
    }
  }

  // 🧩 UI:
  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Konzepterstellung</h1>
        <button
          onClick={() => router.push(`/customers?customerId=${customer?.id || ''}`)}
          className="bg-[#451a3d] text-white px-6 py-2 rounded-none hover:bg-[#6b3c67] transition-all focus:outline-none border-none"
        >
          Zum Kundenprofil
        </button>
      </div>

      {customer && (
        <p className="mb-4 text-[#6b3c67]">
          <strong>Kunde:</strong> {customer.name}
        </p>
      )}

      {/* Konzept-Auswahl */}
      <div className="mb-6 max-w-xs">
        <label className="block mb-2 font-semibold text-[#451a3d]">Konzept wählen</label>
        <select
          value={selectedConcept}
          onChange={(e) => setSelectedConcept(e.target.value)}
          className="w-full bg-[#f9f7f8] text-[#451a3d] border border-[#d9c8d5] py-2 px-3 focus:ring-2 focus:ring-[#451a3d]"
        >
          <option value="Starter">Starter</option>
          <option value="Essential">Essential</option>
          <option value="Professional">Professional</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      {/* 🆕 Nur bei Enterprise anzeigen */}
      {selectedConcept === 'Enterprise' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Leistungen wählen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(categories).map(([category, titles]) => (
              <div key={category}>
                <h3 className="font-bold text-lg mb-2">{category}</h3>
                <div className="flex flex-col gap-2 border border-gray-200 rounded p-4 bg-white">
                  {titles.map((title) => {
                    const service = services.find((s) => s.title === title)
                    if (!service) return null
                    return (
                      <label key={title} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(title)}
                          onChange={() => toggleService(title)}
                          className="mt-1 accent-[#451a3d]"
                        />
                        <span>{service.description}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dokumente */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Dokumentenvorlagen</label>
        <div className="flex flex-col gap-2 border border-gray-200 rounded p-4 bg-white">
          {templates.length === 0 ? (
            <p className="text-gray-500 italic">Keine Vorlagen gefunden.</p>
          ) : (
            templates.map((template) => (
              <label key={template} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(template)}
                  onChange={() => toggleDoc(template)}
                  className="accent-[#451a3d]"
                />
                <span>{template}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="bg-[#451a3d] text-white px-6 py-2 hover:bg-[#6b3c67] transition-all"
        >
          Dokumente hinzufügen
        </button>
      </div>
    </div>
  )
}
