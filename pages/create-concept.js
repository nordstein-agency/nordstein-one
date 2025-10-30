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
        console.error('Fehler beim Laden der Templates:', error)
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

      const uploadedFile = uploadResult.uploadedFiles[0] // Name ohne .pdf
      const fileId = uploadResult.fileIds?.[0]
      const folderId = uploadResult.folderId

      if (!fileId || !folderId) {
        alert('Fehler: Datei- oder Ordner-ID fehlt in der Upload-Antwort.')
        console.error('❌ Ungültige Upload-Response:', uploadResult)
        return
      }

      const fullDocumentName = uploadedFile + '.pdf'
      console.log('📂 Datei-Infos:', { uploadedFile, fileId, folderId })

      // 2️⃣ Direktlink über getfilelink holen (statt Publink)
      const getFileRes = await fetch(
        `/api/get-pcloud-file?customerName=${encodeURIComponent(customer.name)}&documentName=${encodeURIComponent(fullDocumentName)}`
      )

      if (!getFileRes.ok) {
        const errText = await getFileRes.text()
        console.error('❌ /api/get-pcloud-file fehlgeschlagen:', errText)
        alert('Fehler beim Erzeugen des Dateilinks.')
        return
      }

      const fileData = await getFileRes.json()
      const fileUrlFinal = fileData.url
      console.log('🔗 Direkter Dateilink (pCloud CDN):', fileUrlFinal)

      // 3️⃣ Vertrag in Supabase direkt mit PDF-Link anlegen
      const { data: contractData, error: insertError } = await supabase
        .from('contracts')
        .insert([
          {
            tarif: selectedConcept,
            customer_id: customer.id,
            user_id: customer.user_id,
            state: 'Antrag',
            pdf_url: fileUrlFinal, // 👈 direkter CDN-Link
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
