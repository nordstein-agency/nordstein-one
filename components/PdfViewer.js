'use client';
import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // ✅ Richtiger Import für Next.js

export default function PdfViewer({ fileUrl, documentName }) {
  const [proxyUrl, setProxyUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureQr, setSignatureQr] = useState(null);

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

  const handleAddSignature = () => {
    const signatureLink = `${window.location.origin}/sign?doc=${encodeURIComponent(
      documentName
    )}&session=${Date.now()}`;

    setSignatureQr(signatureLink);
    setSignatureMode(true);
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
              className="bg-[#007bff] text-white px-4 py-2"
            >
              Signaturfeld hinzufügen
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
      {signatureMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-bold mb-2">📱 QR-Code für Signatur</h2>
            <p className="mb-4 text-sm text-gray-600">
              Scanne den QR-Code mit deinem Smartphone, um das Dokument zu unterschreiben.
            </p>
            <QRCodeCanvas value={signatureQr} size={200} /> {/* ✅ Richtig */}
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
    </div>
  );
}
