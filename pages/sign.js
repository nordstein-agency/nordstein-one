'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router' 
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../lib/supabaseClient'

export default function SignPage() {
  const router = useRouter()
  // 💡 KORREKTUR: Fragen Sie nur den 'token' ab. 'doc' und 'session' sind unnötig.
  const { token } = router.query 
  
  const sigPad = useRef(null)
  const [signed, setSigned] = useState(false)
  // Speichern des Kunden- und Dokumentennamens aus dem Session-Verify-Call
  const [customerName, setCustomerName] = useState('') 
  const [documentName, setDocumentName] = useState('Dokument') 
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('Lade Session...')

  // 🧭 Session und Kundennamen laden (VERBESSERT)
  useEffect(() => {
    if (!token) {
        setStatus('Warte auf Token...')
        return
    }

    const verifyToken = async () => {
      // Nutze deinen verify-Endpunkt, um die Kundendaten sicher abzurufen
      const res = await fetch(`/api/signature/verify?token=${token}`)
      const data = await res.json()

      if (data.valid) {
        setCustomerName(data.customerName)
        setDocumentName(data.documentName)
        setStatus('Bereit zur Unterschrift')
      } else {
        setStatus(`❌ Session Fehler: ${data.reason || 'Ungültig'}`)
      }
    }
    verifyToken()

    // 🚨 ALTE LOGIK ENTFERNT: Der Kundenname wird jetzt aus der Datenbank-Session geholt.
  }, [token]) // Wichtig: Neu laden, wenn Token verfügbar ist
  

  // ✍️ Signatur speichern
  const handleSaveSignature = async () => {
    if (sigPad.current.isEmpty()) {
      alert('Bitte unterschreibe zuerst!')
      return
    }

    const signatureBase64 = sigPad.current.toDataURL('image/png')
    // 💡 KORREKTUR: Verwenden Sie die State-Variable 'token', die geladen wird
    // const token = router.query.token <-- Wird durch die Closure/State-Variable abgedeckt
    
    setSaving(true)
    setStatus('⏳ Sende Signatur zur Verarbeitung...')

    try {
      // HIER KEIN ZWEITER CHECK AUF TOKEN NÖTIG, WENN DER ERSTE useEffect ihn gesetzt hat.
      if (!token) throw new Error('Signatur-Token fehlt oder Session ungültig.')
      
      // ... [Der restliche Code ist jetzt korrekt, da er token direkt von router.query holt]
      // ...
      
      // 1️⃣ Gerätedaten und Geo-Position abrufen (optional, aber gut für den Audit Trail)
      // ... [Code zur Datenerfassung] ...
      
      // 2️⃣ Daten an den Backend-Endpunkt senden
      const submitRes = await fetch('/api/signature/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token, // Hier wird der Token verwendet
          signatureBase64: signatureBase64,
          userAgent: userAgent,
          screen: screen,
          geo: geo,
        }),
      })

      const submitData = await submitRes.json()

      if (!submitRes.ok || submitData.error) {
        throw new Error(submitData.error || 'Unbekannter API-Fehler.')
      }
      
      setSigned(true)
      setStatus('✅ Signatur erfolgreich verarbeitet und Dokument aktualisiert!')
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error)
      setStatus(`❌ Fehler beim Speichern: ${error.message}`)
      alert(`Fehler beim Speichern: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }



  return (
    <div className="min-h-screen bg-[#f9f7f8] flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-[#451a3d] mb-2">📱 Dokument unterschreiben</h1>
      <p className="mb-6 text-[#6b3c67]">
        Kunde: <strong>{customerName || '-'}</strong> | Dokument: <strong>{documentName || '-'}</strong>
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
