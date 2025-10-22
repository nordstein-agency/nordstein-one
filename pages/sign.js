'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../lib/supabaseClient'

export default function SignPage() {
  const router = useRouter()
  const { doc, session } = router.query
  const sigPad = useRef(null)
  const [signed, setSigned] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  // 🧭 Kundenname aus der URL extrahieren (z. B. vorher mit docName verknüpft)
  useEffect(() => {
    if (!doc) return
    const parts = doc.split('-')
    setCustomerName(parts[0] || '')
  }, [doc])

  // ✍️ Signatur speichern
  const handleSaveSignature = async () => {
    if (sigPad.current.isEmpty()) {
      alert('Bitte unterschreibe zuerst!')
      return
    }

    const signatureData = sigPad.current.toDataURL('image/png')
    const signedAt = new Date().toISOString()

    setSaving(true)
    setStatus('⏳ Speichere Signatur...')

    try {
      // 1️⃣ Signatur als Bild in Supabase Storage hochladen
      const fileName = `${doc || 'unbekannt'}_${session}_sign.png`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, signatureData.split(',')[1], {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 2️⃣ Metadaten in die Supabase-Tabelle schreiben
      const { error: dbError } = await supabase.from('customer_signatures').insert([
        {
          document_name: doc || 'unbekannt',
          customer_name: customerName || 'Unbekannt',
          signed_at: signedAt,
          session_id: session,
          signature_url: `https://qtniwqhmnfgftaqioinb.supabase.co/storage/v1/object/public/signatures/${fileName}`,
        },
      ])

      if (dbError) throw dbError

      setSigned(true)
      setStatus('✅ Signatur gespeichert!')
      alert('Signatur erfolgreich gespeichert!')
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error)
      setStatus('❌ Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f7f8] flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-[#451a3d] mb-2">📱 Dokument unterschreiben</h1>
      <p className="mb-6 text-[#6b3c67]">
        Dokument: <strong>{doc}</strong>
      </p>

      {/* Signaturfeld */}
      <div className="bg-white border border-gray-300 shadow-lg p-4 mb-4">
        <SignatureCanvas
          ref={sigPad}
          penColor="#000000"
          canvasProps={{
            width: 350,
            height: 200,
            className: 'border border-gray-400 bg-gray-50',
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => sigPad.current.clear()}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Löschen
        </button>

        <button
          onClick={handleSaveSignature}
          disabled={saving}
          className={`${
            saving ? 'bg-gray-400' : 'bg-[#451a3d]'
          } text-white px-4 py-2 rounded`}
        >
          {saving ? 'Speichere...' : 'Unterschrift speichern'}
        </button>
      </div>

      {/* Status */}
      {status && <p className="mt-6 text-[#451a3d]">{status}</p>}

      {/* Erfolgsanzeige */}
      {signed && (
        <div className="mt-8 text-center">
          <p className="text-green-600 font-bold mb-2">
            ✅ Erfolgreich unterschrieben!
          </p>
          <button
            onClick={() => window.close()}
            className="bg-[#28a745] text-white px-6 py-2 rounded"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
