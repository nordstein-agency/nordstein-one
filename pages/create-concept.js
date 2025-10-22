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
      console.log("🚀 Lade Vorlagen aus Supabase...")

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

  // 🔹 Konzept speichern
  const handleSaveConcept = async () => {
    if (!customer) {
      alert('Kunde nicht gefunden.')
      return
    }

    try {
      const { error } = await supabase.from('contracts').insert([
        {
          tarif: selectedConcept,
          customer_id: customer.id,
          user_id: customer.user_id,
          state: 'Antrag'
        }
      ])
      if (error) throw error

      alert('Konzept erfolgreich erstellt!')
      router.push(`/customers?customerId=${customer.id}`)
    } catch (err) {
      console.error('Fehler beim Speichern des Konzepts:', err)
      alert('Fehler beim Erstellen des Konzepts.')
    }
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">Lädt...</div>
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

      {/* Dropdown Konzept wählen */}
      <div className="mb-6 max-w-xs">
        <label className="block mb-2 font-semibold text-[#451a3d]">
          Konzept wählen
        </label>
        <div className="relative inline-block w-full">
          <select
            value={selectedConcept}
            onChange={(e) => setSelectedConcept(e.target.value)}
            className="appearance-none w-full bg-[#f9f7f8] text-[#451a3d] font-[Inter Tight] font-medium border border-[#d9c8d5] py-2.5 px-4 rounded-none focus:outline-none focus:ring-2 focus:ring-[#451a3d] focus:border-[#451a3d] hover:bg-[#f2edf1] transition-all"
          >
            <option value="Starter">Starter</option>
            <option value="Essential">Essential</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Custom Pfeil */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#451a3d]">
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Checkbox-Liste */}
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
        <div className="flex justify-end">
          <button
            onClick={async () => {
              // 🪟 Tab sofort öffnen (Popup-Schutz umgehen)
              const newTab = window.open('', '_blank')
              if (newTab) {
                newTab.document.write(`
                  <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #451a3d;">
                    <h2>📄 Dokument wird vorbereitet...</h2>
                    <p>Bitte einen Moment Geduld.</p>
                  </div>
                `)
              }

              try {
                if (selectedDocs.length === 0) {
                  alert('Bitte mindestens ein Dokument auswählen!')
                  if (newTab) newTab.close()
                  return
                }

                // 1️⃣ Konzept speichern
                await handleSaveConcept()

                // 2️⃣ Hochladen in PCloud
                const res = await fetch('/api/add-customer-docs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customerName: customer.name,
                    files: selectedDocs,
                  }),
                })

                const result = await res.json()
                if (!res.ok) throw new Error(result.message)

                alert(`✅ ${result.uploadedFiles.length} Dokument(e) erfolgreich in PCloud hochgeladen!`)

                // 3️⃣ Kundenordner anhand des Namens öffnen
                const folderSearchUrl = `${process.env.NEXT_PUBLIC_PCLOUD_API_URL}/listfolder?folderid=${process.env.NEXT_PUBLIC_PCLOUD_CUSTOMERS_FOLDER_ID}&access_token=${process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN}`
                const folderResponse = await fetch(folderSearchUrl)
                const folderData = await folderResponse.json()

                const folder = folderData.metadata?.contents?.find(
                  (item) => item.name === customer.name && item.isfolder
                )

                if (!folder) {
                  alert('Kein pCloud-Ordner für diesen Kunden gefunden.')
                  if (newTab) newTab.close()
                  return
                }

                const folderId = folder.folderid
                const firstFile = result.uploadedFiles[0]

                const editorUrl = `/pdf-editor?customerId=${customer.id}&customerName=${encodeURIComponent(
                  customer.name
                )}&folderId=${folderId}&documentName=${encodeURIComponent(firstFile + '.pdf')}`

                // 🔗 Tab weiterleiten
                if (newTab) newTab.location.href = editorUrl
              } catch (err) {
                console.error('❌ Upload-Fehler:', err)
                alert('Fehler beim Hochladen der Dokumente in PCloud.')
                if (newTab) newTab.close()
              }
            }}
            className="bg-[#451a3d] text-white px-6 py-2 rounded-none hover:bg-[#6b3c67] transition-all focus:outline-none border-none"
          >
            Dokumente hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
