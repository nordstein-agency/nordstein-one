'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router' 
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../lib/supabaseClient'

export default function SignPage() {
  const router = useRouter()
  // Nur den 'token' abfragen
  const { token } = router.query 
  
  const sigPad = useRef(null)
  const [signed, setSigned] = useState(false)
  const [customerName, setCustomerName] = useState('') 
  const [documentName, setDocumentName] = useState('Dokument') 
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('Lade Session...')

  // 🧭 Session und Kundennamen laden (KORRIGIERT: Wartet auf router.isReady)
  useEffect(() => {
    // 1. Warten, bis der Router die Query-Parameter geladen hat (Next.js-Standard)
    if (!router.isReady) {
        setStatus('Initialisiere...')
        return
    }
    
    // 2. Token direkt aus dem geladenen Router-Query holen
    const currentToken = router.query.token;

    if (!currentToken) {
        setStatus('❌ Fehler: Signatur-Token fehlt in der URL.')
        return
    }
    
    // 3. Wenn der Token da ist, Status setzen und Verifizierung starten
    setStatus('Starte Verifizierung...')

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/signature/verify?token=${currentToken}`)
        const data = await res.json()

        if (data.valid) {
          setCustomerName(data.customerName)
          setDocumentName(data.documentName)
          setStatus('Bereit zur Unterschrift')
        } else {
          setStatus(`❌ Session Fehler: ${data.reason || 'Ungültig'}. Bitte Link prüfen.`)
        }
      } catch (err) {
          setStatus('❌ Serverfehler bei der Verifizierung.')
          console.error("Verifizierungsfehler:", err);
      }
    }
    verifyToken()

  // Abhängigkeiten: Führt den Effekt aus, sobald der Router bereit ist
  // Wir nutzen hier router.isReady, da der Token sonst beim ersten Render undefined ist.
  }, [router.isReady]) 
  

  // ✍️ Signatur speichern
  const handleSaveSignature = async () => {
    if (sigPad.current.isEmpty()) {
      alert('Bitte unterschreibe zuerst!')
      return
    }
    
    // Token direkt aus router.query holen, da er im useEffect als verfügbar gesetzt wurde
    const currentToken = router.query.token;
    const signatureBase64 = sigPad.current.toDataURL('image/png')
    
    setSaving(true)
    setStatus('⏳ Sende Signatur zur Verarbeitung...')

    try {
      if (!currentToken) {
         throw new Error('Signatur-Token fehlt oder Session ungültig.');
      }
      
      // 1️⃣ Gerätedaten und Geo-Position abrufen (IMPLEMENTIERUNG HINZUGEFÜGT)
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
      }

      // 2️⃣ Daten an den Backend-Endpunkt senden
      const submitRes = await fetch('/api/signature/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken, // HIER wird der Token verwendet
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