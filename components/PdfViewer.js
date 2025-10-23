// /components/PdfViewer.js (VOLLSTÄNDIG KORRIGIERT FÜR DYNAMISCHE POSITION & RELOAD FIX)

'use client';
import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/router';

export default function PdfViewer({ fileUrl, documentName, customerName: propCustomerName, folderId, customerId, onSignatureClose }) {
  const router = useRouter();

  const [proxyUrl, setProxyUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureQr, setSignatureQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  
  // ✅ NEU: State für die Signaturposition (wird hier simuliert)
  const [sigPosition, setSigPosition] = useState(null); 

  const finalCustomerName = propCustomerName || 'UnbekannterKunde';

  useEffect(() => {
    if (fileUrl) {
      console.log('✅ Proxy-Link erhalten:', fileUrl);
      setProxyUrl(fileUrl);
    }
  }, [fileUrl]);

  if (!proxyUrl) {
    return <div className="p-10 text-[#451a3d]">📄 PDF wird geladen...</div>;
  }

  const handleAddTextField = () => {
    alert('📝 (Demo) Textfeld hinzugefügt – hier später frei positionierbar.');
  };

  // 💡 NEUE FUNKTION: Simuliert das Setzen der Position (später mit Klick-Logik ersetzen)
  const handlePlaceSignature = () => {
      // Setzt eine feste Testposition auf Seite 1. 
      // Diese Werte müssen in der finalen Lösung durch tatsächliche Klick-Koordinaten ersetzt werden.
      const newPos = { x: 450, y: 180, page: 1 }; 
      setSigPosition(newPos);
      alert(`✅ Signaturposition gesetzt bei: X=${newPos.x}, Y=${newPos.y} auf Seite ${newPos.page}.`);
  };

  // ✍️ API-Aufruf, um den Token-Link abzurufen
  const handleAddSignature = async () => {
    
    // 🛑 PRÜFUNG: Position muss gesetzt sein
    if (!sigPosition) {
        alert("❌ Bitte zuerst die Position der Unterschrift im Dokument festlegen!");
        return;
    }
    
    setLoadingQr(true);
    setSignatureQr(null); 

    try {
        // Daten für die API-Route vorbereiten
        const signatureData = {
            customerId: customerId,
            customerName: finalCustomerName, 
            documentName: documentName,
            role: 'customer',
            folderId: folderId,
            // ✅ NEU: Dynamische Position senden
            signaturePosition: sigPosition,
        };

        const res = await fetch('/api/signature/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signatureData)
        });

        const data = await res.json();

        if (res.ok && data.qrUrl) {
            setSignatureQr(data.qrUrl); 
            setSignatureMode(true);
        } else {
            alert(`❌ Fehler beim Erstellen des Signatur-Tokens: ${data.error || 'Unbekannter Fehler'}`);
        }
    } catch (error) {
        console.error('Fehler bei Signatur-API:', error);
        alert('Fehler beim Kommunizieren mit dem Server.');
    } finally {
        setLoadingQr(false);
    }
  };
  
  // ✅ NEUE FUNKTION: Wird aufgerufen, wenn der QR-Code geschlossen wird
  const handleCloseQr = () => {
      setSignatureMode(false);
      // Rufe den Callback auf, der den PDF-Editor neu lädt.
      if (onSignatureClose) {
          onSignatureClose();
      }
  };


  const handleSaveAndClose = () => {
    alert('💾 (Demo) Änderungen gespeichert & in pCloud hochgeladen.');
  };

  return (
    <div className="flex flex-col items-center bg-[#f9f7f8] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#451a3d] mb-4">
        PDF-Editor: {documentName}
      </h1>

      <p className="mb-6 text-[#6b3c67]">
        Kunde: <strong>{decodeURIComponent(finalCustomerName) || '-'}</strong> | Dokument: <strong>{documentName || '-'}</strong>
      </p>

      {/* Toolbar */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setEditing(!editing)}
          className="bg-[#451a3d] text-white px-4 py-2"
        >
          {editing ? 'Bearbeitung beenden' : 'Bearbeiten'}
        </button>

        {editing && (
          <>
            <button
              onClick={handleAddTextField}
              className="bg-[#6b3c67] text-white px-4 py-2"
            >
              Textfeld hinzufügen
            </button>
            
            {/* ✅ NEUER BUTTON FÜR POSITIONIERUNG */}
            <button
              onClick={handlePlaceSignature}
              className={`px-4 py-2 ${sigPosition ? 'bg-green-600' : 'bg-[#3498db]'} text-white`} 
            >
              Position festlegen {sigPosition ? ' (Gesetzt!)' : ''}
            </button>


            <button
              onClick={handleAddSignature}
              disabled={loadingQr || !sigPosition} // Deaktiviert, wenn keine Position gesetzt ist
              className="bg-[#007bff] text-white px-4 py-2"
            >
              {loadingQr ? 'Link generieren...' : 'Signatur starten'}
            </button>

            <button
              onClick={handleSaveAndClose}
              className="bg-[#28a745] text-white px-4 py-2"
            >
              Speichern & Schließen
            </button>
          </>
        )}
      </div>

      {/* PDF Anzeige */}
      <div className="bg-white shadow-lg p-2 border border-[#ddd] w-full max-w-5xl">
        <iframe
          src={proxyUrl}
          width="100%"
          height="900px"
          style={{ border: 'none' }}
          title="PDF Viewer"
        />
      </div>

      {/* Signatur QR-Code Modal */}
      {signatureMode && signatureQr && ( 
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-bold mb-2">📱 QR-Code für Signatur</h2>
            <p className="mb-4 text-sm text-gray-600">
              **WICHTIG:** Unterschreiben Sie jetzt und schließen Sie dieses Fenster, um die PDF im Editor neu zu laden.
            </p>
            <QRCodeCanvas value={signatureQr} size={200} />
            <div className="mt-4">
              <button
                // ✅ RUFT handleCloseQr AUF
                onClick={handleCloseQr} 
                className="bg-[#451a3d] text-white px-4 py-2"
              >
                Fertig / Schließen
              </button>
            </div>
          </div>
        </div>
      )}
      {signatureMode && loadingQr && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-lg text-center">
                  <p>Generiere Signatur-Link...</p>
              </div>
          </div>
      )}
    </div>
  );
}