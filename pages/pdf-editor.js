// /pages/pdf-editor.js (VOLLSTÄNDIG KORRIGIERT FÜR RELOAD UND NEUE DATEI)

'use client';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';

// 📦 PDF-Viewer-Komponente wird nur im Browser geladen
const PdfViewer = dynamicImport(() => import('../components/PdfViewer'), {
  ssr: false,
  loading: () => <div className="p-10 text-[#451a3d]">📄 Lade PDF...</div>,
});

// ⚙️ Erzwingt dynamisches Rendering
export const dynamic = 'force-dynamic';

export default function PdfEditor() {
  const router = useRouter();
  const { customerId, customerName, documentName, folderId } = router.query;
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);
  
  // ✅ NEU: Schlüssel zur erzwingenden Neuladung des useEffects
  const [loadTrigger, setLoadTrigger] = useState(0); 
  
  // Funktion zum Laden der PDF
  const fetchPdf = useCallback(async (docName) => {
      if (!customerName || !docName) return false;
      
      console.log(`🔍 Lade Datei: ${docName} von pCloud über Server-Route...`);

      try {
        // 1️⃣ Anfrage an eigene API (holt pCloud-Link)
        const resp = await fetch(
          `/api/get-pcloud-file?customerName=${encodeURIComponent(
            customerName
          )}&documentName=${encodeURIComponent(docName)}`
        );

        const data = await resp.json();
        console.log('📡 API Antwort:', data);

        if (data.url) {
          // 2️⃣ Verwende internen Proxy
          const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(data.url)}`;
          console.log('✅ Proxy-Link verwendet:', proxyUrl);
          setFileUrl(proxyUrl);
          //setFileUrl(data.url); // Direktlink verwenden
          setError(null);
          return true; // Erfolgreich geladen
        } 
        return false; // Laden fehlgeschlagen
      } catch (err) {
        console.error('❌ Serverfehler beim Laden der PDF:', err);
        setError('Serverfehler beim Laden der PDF-Datei');
        return false;
      }
    }, [customerName]);
    
  // ✅ NEUE FUNKTION: Der Callback, der den Viewer neu lädt
  const handleViewerReload = () => {
      // Setze den Trigger, um den useEffect neu zu starten
      alert('Signaturprozess beendet. Dokument wird neu geladen, um die Unterschrift anzuzeigen.');
      setLoadTrigger(prev => prev + 1);
  };


  useEffect(() => {
    if (!customerName || !documentName) return;

    // 💡 Lade-Logik: Versuche zuerst die unterschriebene Version zu laden
    const tryLoadPdf = async () => {
        // Berechne den erwarteten Namen des unterschriebenen Dokuments
        const signedDocName = documentName.replace(
            /\.pdf$/i,
            '_signed_customer.pdf'
        );

        setFileUrl(null); // Setze den Ladezustand zurück
        setError(null);
        
        // 1. VERSUCH: Unterschriebene Version laden
        const loadedSigned = await fetchPdf(signedDocName);
        
        if (!loadedSigned) {
            // 2. VERSUCH (Fallback): Originalversion laden (wenn die signierte nicht gefunden wurde)
            if (signedDocName !== documentName) {
                await fetchPdf(documentName);
            }
        }
    };
    
    tryLoadPdf();
    // ✅ Füge loadTrigger zu den Abhängigkeiten hinzu, um den Neulade-Befehl auszuführen
  }, [customerName, documentName, fetchPdf, loadTrigger]); 

  // 🕑 Ladeanzeige oder Fehlermeldung
  if (!fileUrl)
    return (
      <div className="p-10 text-[#451a3d]">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              ❌ Fehler beim Laden der PDF
            </h2>
            <p>{error}</p>
          </>
        ) : (
          <>
            📄 PDF wird geladen...
            {/* ... (Debug-Infos) */}
          </>
        )}
      </div>
    );

  // 📄 PDF anzeigen
  return (
    <PdfViewer 
      fileUrl={fileUrl} 
      documentName={documentName} 
      customerName={customerName} 
      folderId={folderId} 
      customerId={customerId} 
      // ✅ ÜBERGIBT DEN RELOAD-CALLBACK
      onSignatureClose={handleViewerReload}
    />
  );
}