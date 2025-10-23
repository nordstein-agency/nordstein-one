'use client';
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; 
import { useRouter } from 'next/router'; 

export default function PdfViewer({ fileUrl, documentName }) {
  const router = useRouter(); 
  
  const [proxyUrl, setProxyUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureQr, setSignatureQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  
  // 💡 HINWEIS: customerName MUSS dynamisch von der aufrufenden Seite kommen
  // Hier wird ein Platzhalter verwendet
  const customerName = 'Max Mustermann'; 

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

  // ✍️ KORRIGIERT: Ruft die API auf, um den Token-Link abzurufen
  const handleAddSignature = async () => {
    setLoadingQr(true);
    setSignatureQr(null); 

    try {
        // Daten für die API-Route vorbereiten
        const signatureData = {
            // 💡 KORREKTUR: customerId (UUID) und folderId (int8) entfernt, 
            // da sie als ungültige Strings gesendet wurden und nullable sind.
            // Im echten Code müssten hier dynamische, gültige UUIDs/Zahlen stehen.
            
            // customerId: 'KUNDE_123', // <--- Entfernt, da ungültiger Typ
            // folderId: 'FOLDER_ABC', // <--- Entfernt, da ungültiger Typ
            
            customerName: customerName, 
            documentName: documentName,
            // Im echten Code muss folderId (int8) und customerId (uuid) bei Bedarf hinzugefügt werden
            role: 'customer' // Rolle für die Signatur (Muss aus dem Frontend kommen)
        };
        
        // Die API benötigt documentName, customerName und role, die hier gesendet werden.
        // customerId und folderId werden jetzt als NULL in Supabase eingefügt.

        // API-Aufruf an den Token-Generator
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

  const handleSaveAndClose = () => {
    alert('💾 (Demo) Änderungen gespeichert & in pCloud hochgeladen.');
  };

  return (
    <div className="flex flex-col items-center bg-[#f9f7f8] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#451a3d] mb-4">
        PDF-Editor: {documentName}
      </h1>

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

            <button
              onClick={handleAddSignature}
              disabled={loadingQr} 
              className="bg-[#007bff] text-white px-4 py-2"
            >
              {loadingQr ? 'Link generieren...' : 'Signaturfeld hinzufügen'}
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
              Scanne den QR-Code mit deinem Smartphone, um das Dokument zu unterschreiben.
            </p>
            <QRCodeCanvas value={signatureQr} size={200} />
            <div className="mt-4">
              <button
                onClick={() => setSignatureMode(false)}
                className="bg-[#451a3d] text-white px-4 py-2"
              >
                Schließen
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