'use client';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// 📦 PDF-Viewer-Komponente wird nur im Browser geladen
const PdfViewer = dynamicImport(() => import('../components/PdfViewer'), {
  ssr: false,
  loading: () => <div className="p-10 text-[#451a3d]">📄 Lade PDF...</div>,
});

// ⚙️ Erzwingt dynamisches Rendering
export const dynamic = 'force-dynamic';

export default function PdfEditor() {
  const router = useRouter();
  const { customerName, documentName, folderId} = router.query;
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerName || !documentName) return;

    const fetchPdf = async () => {
      try {
        console.log('🔍 Lade Datei von pCloud über Server-Route...');

        // 1️⃣ Anfrage an eigene API (holt pCloud-Link)
        const resp = await fetch(
          `/api/get-pcloud-file?customerName=${encodeURIComponent(
            customerName
          )}&documentName=${encodeURIComponent(documentName)}`
        );

        const data = await resp.json();
        console.log('📡 API Antwort:', data);

        if (data.url) {
          // 2️⃣ Verwende internen Proxy zum Laden der PDF (vermeidet CORS)
          const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(data.url)}`;
          console.log('✅ Proxy-Link verwendet:', proxyUrl);
          setFileUrl(proxyUrl);
        } else {
          console.error('❌ Fehler beim Abrufen des PDF-Links:', data.error);
          setError(data.error || 'Fehler beim Laden der PDF-Datei');
        }
      } catch (err) {
        console.error('❌ Serverfehler beim Laden der PDF:', err);
        setError('Serverfehler beim Laden der PDF-Datei');
      }
    };

    fetchPdf();
  }, [customerName, documentName]);

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
            <br />
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                marginTop: '10px',
                color: '#451a3d',
              }}
            >
              customerName: {customerName}
              {'\n'}
              documentName: {documentName}
            </pre>
          </>
        )}
      </div>
    );

  // 📄 PDF anzeigen
  return <PdfViewer fileUrl={fileUrl} documentName={documentName} customerName={customerName} folderId={folderId} />;
}
