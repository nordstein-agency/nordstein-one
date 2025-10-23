// /components/PdfViewer.js (VOLLSTÄNDIG KORRIGIERT FÜR DYNAMISCHE POSITION DURCH MAUSKLICK)

'use client';
import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/router';

// ⚠️ WICHTIG: Die Höhe des iFrames muss hier für die Y-Achsen-Berechnung bekannt sein
const IFRAME_HEIGHT = 900; 

export default function PdfViewer({ fileUrl, documentName, customerName: propCustomerName, folderId, customerId, onSignatureClose }) {
  const router = useRouter();

  const [proxyUrl, setProxyUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureQr, setSignatureQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  
  // ✅ NEU: State für den Platzierungsmodus
  const [placementMode, setPlacementMode] = useState(false);
  
  // ✅ NEU: Ref für den Container, um Klick-Koordinaten zu berechnen
  const pdfContainerRef = useRef(null); 
  
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

  // 💡 FUNKTION: Aktiviert den Platzierungsmodus
  const handlePlaceSignature = () => {
      setPlacementMode(true);
      setSigPosition(null); // Alte Position zurücksetzen
      // alert("Klicke jetzt auf die Stelle im PDF, wo die Unterschrift platziert werden soll.");
  };
  
  // 🖱️ NEUE FUNKTION: Fängt den Mausklick auf dem Overlay ab und speichert die PDF-Koordinate
  const handlePdfClick = (event) => {
      if (!placementMode || !pdfContainerRef.current) return;
      
      const rect = pdfContainerRef.current.getBoundingClientRect();
      
      // 1. Klick-Koordinate innerhalb des Containers (Browser-Achse: Y von oben)
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // 2. Umrechnung in PDF-Koordinaten (PDF-Achse: Y von unten)
      // Wir nehmen die feste Höhe des iFrames (900px) an
      const pdfY = IFRAME_HEIGHT - clickY; 
      const pdfX = clickX; 
      
      // Wir verwenden Seite 1 als Standard (für Multi-Page müsste das komplexer sein)
      const newPos = { 
          x: Math.round(pdfX), 
          y: Math.round(pdfY), 
          page: 1 
      }; 
      
      setSigPosition(newPos);
      setPlacementMode(false); // Modus deaktivieren
      console.log(`✅ Position gespeichert: (${newPos.x}, ${newPos.y}) auf Seite ${newPos.page}.`);
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
          onClick={() => {
            setEditing(!editing);
            setPlacementMode(false); // Modus bei Beenden/Starten ausschalten
          }}
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
            
            {/* ✅ BUTTON FÜR POSITIONIERUNG */}
            <button
              onClick={handlePlaceSignature}
              className={`px-4 py-2 text-white transition-colors duration-200 
                ${placementMode 
                  ? 'bg-orange-500 animate-pulse' 
                  : sigPosition 
                    ? 'bg-green-600' 
                    : 'bg-[#3498db]'
                }`
              } 
            >
              Position festlegen {sigPosition ? ' (Gesetzt!)' : ''}
            </button>


            <button
              onClick={handleAddSignature}
              disabled={loadingQr || !sigPosition || placementMode} // Deaktiviert, wenn keine Position gesetzt ist oder im Platzierungsmodus
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

      {/* 🖼️ PDF Anzeige mit Klick-Overlay */}
      <div 
        ref={pdfContainerRef} // Ref hinzufügen
        onClick={handlePdfClick} // Klick-Handler hinzufügen
        style={{ height: `${IFRAME_HEIGHT}px` }} // Feste Höhe setzen
        className={`relative bg-white shadow-lg p-2 border border-[#ddd] w-full max-w-5xl transition-all 
          ${placementMode ? 'cursor-crosshair' : ''} 
        `}
      >
        <iframe
          src={proxyUrl}
          width="100%"
          height="100%" // Passt sich dem Elternelement an (900px)
          style={{ border: 'none' }}
          title="PDF Viewer"
          // 💡 WICHTIG: Das Iframe muss Klicks ignorieren, wenn im Placement Mode
          className={placementMode ? 'pointer-events-none opacity-50' : ''}
        />
        
        {/* 💡 Visueller Marker für die gesetzte Position */}
        {sigPosition && !placementMode && (
             <div 
                style={{ 
                    position: 'absolute', 
                    // Konvertierung zurück in Browser-Koordinaten für die Anzeige (Y von oben)
                    left: `${sigPosition.x}px`, 
                    top: `${IFRAME_HEIGHT - sigPosition.y}px`, 
                    transform: 'translate(-50%, -100%)', // Zentriert den Marker am Klickpunkt
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 0, 0, 0.4)', 
                    border: '2px dashed red',
                    pointerEvents: 'none', // Muss Klicks ignorieren
                    zIndex: 10
                }}
                title={`Gesetzte PDF-Koordinate: X:${sigPosition.x}, Y:${sigPosition.y}`}
             />
        )}
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