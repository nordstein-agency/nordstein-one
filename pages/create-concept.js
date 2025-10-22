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

  // 🔹 Hauptfunktion: Konzept speichern + Upload + Update + Editor öffnen
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

      // 1️⃣ Vertrag in Supabase anlegen
      const { data: contractData, error: insertError } = await supabase
        .from('contracts')
        .insert([
          {
            tarif: selectedConcept,
            customer_id: customer.id,
            user_id: customer.user_id,
            state: 'Antrag',
          },
        ])
        .select('id')
        .single()

      if (insertError) throw insertError
      console.log('📦 Neuer Vertrag erstellt:', contractData)

      // 2️⃣ Datei in PCloud hochladen
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
      const fileUrl = `https://pcloud.com/${customer.name}/${uploadedFile}.pdf` // Fallback

      // 3️⃣ Kundenordner in PCloud finden
      const folderSearchUrl = `${process.env.NEXT_PUBLIC_PCLOUD_API_URL}/listfolder?folderid=${process.env.NEXT_PUBLIC_PCLOUD_CUSTOMERS_FOLDER_ID}&access_token=${process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN}`
      const folderResponse = await fetch(folderSearchUrl)
      const folderData = await folderResponse.json()

      const folder = folderData.metadata?.contents?.find(
        (item) => item.name === customer.name && item.isfolder
      )
      if (!folder) {
        alert('Kein pCloud-Ordner für diesen Kunden gefunden.')
        return
      }

      const folderId = folder.folderid

      // 4️⃣ PDF-Link ermitteln
      const fileLinkRes = await fetch(
        `${process.env.NEXT_PUBLIC_PCLOUD_API_URL}/getfilelink?path=/customers/${encodeURIComponent(
          customer.name
        )}/${encodeURIComponent(uploadedFile)}.pdf&access_token=${
          process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN
        }`
      )
      const fileLinkData = await fileLinkRes.json()
      const fileUrlFinal =
        fileLinkData.result === 0 && fileLinkData.host && fileLinkData.path
          ? `https://${fileLinkData.host}${fileLinkData.path}`
          : fileUrl

      console.log('🔗 Finaler PDF-Link:', fileUrlFinal)

      // 5️⃣ Supabase mit pdf_url updaten
      const updateRes = await fetch('/api/update-contract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contractData.id, pdfUrl: fileUrlFinal }),
      })
      const updateResult = await updateRes.json()
      console.log('🧩 Update-Ergebnis:', updateResult)

      // 6️⃣ PDF-Editor direkt öffnen ✅
      const editorUrl = `/pdf-editor?customerId=${customer.id}&customerName=${encodeURIComponent(
        customer.name
      )}&folderId=${folderId}&documentName=${encodeURIComponent(uploadedFile + '.pdf')}`

      window.open(editorUrl, '_blank') // 👈 direkt öffnen, wie vorher
    } catch (err) {
      console.error('❌ Fehler in create-concept:', err)
      alert('Fehler beim Erstellen des Konzepts.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Konzepterstellung</h1>
        <button
          onClick={() => router.push(`/customers?customerId=${customer?.id || ''}`)}
          className="bg-[#451a3d] text-white px-6 py-2 rounded-none hover:bg-[#6b3c67] transition-all focus:outline-none border-none"
        >
          Zum Kundenprofil
        </button>
      </div>

      {/* Kunde */}
      {customer && (
        <p className="mb-4 text-[#6b3c67]">
          <strong>Kunde:</strong> {customer.name}
        </p>
      )}

      {/* Konzept Dropdown */}
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

      {/* Templates */}
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
