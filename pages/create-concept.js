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

  // 🔹 Templates laden
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

  // 🔹 Services laden
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase.from('services').select('title, description')
      if (error) {
        console.error('Fehler beim Laden der Services:', error)
        return
      }
      setServices(data || [])
    }
    fetchServices()
  }, [])

  const toggleDoc = (name) => {
    setSelectedDocs((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    )
  }

  const toggleService = (title) => {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
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

      // 🧮 Vertragsnummer berechnen
      const yearShort = new Date().getFullYear().toString().slice(-2)
      const { data: existingContracts } = await supabase
        .from('contracts')
        .select('contract_nr')
        .like('contract_nr', `C${yearShort}%`)
        .order('contract_nr', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (existingContracts && existingContracts.length > 0) {
        const lastNr = existingContracts[0].contract_nr
        const lastNumeric = parseInt(lastNr.slice(3))
        nextNumber = lastNumeric + 1
      }

      const newContractNr = `C${yearShort}${String(nextNumber).padStart(6, '0')}`
      console.log('🆕 Neue Vertragsnummer:', newContractNr)

      // 🆕 Neuer Dateiname für Upload
      const newFileName = `${newContractNr}_${selectedDocs[0]}.pdf`

      // 1️⃣ Datei in pCloud hochladen
      const uploadRes = await fetch('/api/add-customer-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          files: selectedDocs,
          newFileName, // 🆕 hier
        }),
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.message)
      console.log('✅ Upload abgeschlossen:', uploadResult)

      const uploadedFile = uploadResult.uploadedFiles[0]
      const folderId = uploadResult.folderId
      const fullDocumentName = `${uploadedFile}.pdf` // jetzt korrekt!




      // 2️⃣ Direktlink holen (mit Kundenname)
const directRes = await fetch(
  `/api/get-direct-link?customerName=${encodeURIComponent(
    customer.name
  )}&fileName=${encodeURIComponent(fullDocumentName)}`
)

const directData = await directRes.json()
if (!directRes.ok || !directData.ok) throw new Error('Fehler beim Erzeugen des Links')

const fileUrlFinal = directData.directUrl
console.log('🔗 Stabiler Direktlink:', fileUrlFinal)





      // 3️⃣ Vertrag speichern
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
            contract_nr: newContractNr,
            services_selected: selectedServices,
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

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">Lädt...</div>
  }

  // UI
  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Konzepterstellung</h1>
        <button
          onClick={() => router.push(`/customers?customerId=${customer?.id || ''}`)}
          className="bg-[#451a3d] text-white px-6 py-2 hover:bg-[#6b3c67] transition-all border-none"
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
          className="w-full bg-[#f9f7f8] text-[#451a3d] border border-[#d9c8d5] py-2 px-3"
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
          {templates.map((template) => (
            <label key={template} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDocs.includes(template)}
                onChange={() => toggleDoc(template)}
                className="accent-[#451a3d]"
              />
              <span>{template}</span>
            </label>
          ))}
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
