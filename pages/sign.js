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






  // ✍️ Signatur speichern (KORRIGIERT)
  const handleSaveSignature = async () => {
    if (sigPad.current.isEmpty()) {
      alert('Bitte unterschreibe zuerst!')
      return
    }

    const signatureBase64 = sigPad.current.toDataURL('image/png')
    const token = router.query.token // Der Token ist in der URL (von sign?token=...)

    setSaving(true)
    setStatus('⏳ Sende Signatur zur Verarbeitung...')

    try {
      if (!token) throw new Error('Signatur-Token fehlt in der URL.')

      // 1️⃣ Gerätedaten und Geo-Position abrufen (optional, aber gut für den Audit Trail)
      const userAgent = navigator.userAgent;
      const screen = { width: window.screen.width, height: window.screen.height };
      let geo = null;
      try {
          // Versuche, Geo-Daten abzurufen (kann fehlschlagen/abgelehnt werden)
          geo = await new Promise((resolve) => {
              if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                      (pos) => resolve({ coords: pos.coords }),
                      () => resolve(null), // Fehler
                      { timeout: 5000 } // Timeout
                  );
              } else {
                  resolve(null);
              }
          });
      } catch (e) {
        console.warn("Geo-Location konnte nicht abgerufen werden:", e);
        // Nicht kritisch, wir machen weiter
      }


      // 2️⃣ Daten an den Backend-Endpunkt senden
      const submitRes = await fetch('/api/signature/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          signatureBase64: signatureBase64,
          userAgent: userAgent,
          screen: screen,
          geo: geo,
          // Weitere benötigte Daten aus router.query können hier hinzugefügt werden,
          // aber der Token sollte alle notwendigen Infos in der Session halten.
        }),
      })

      const submitData = await submitRes.json()

      if (!submitRes.ok || submitData.error) {
        throw new Error(submitData.error || 'Unbekannter API-Fehler.')
      }
      
      // ACHTUNG: Die Felder doc und session in router.query MÜSSEN den Token halten.
      // Ihre sign.js verwendet doc und session, aber der Backend-Endpunkt verwendet NUR token.
      // Wir verwenden hier den Token-Parameter, der im verify- und submit-Endpunkt erwartet wird.
      
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
