// pages/sign.js
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SignaturePad from 'signature_pad';

export default function SignPage() {
  const router = useRouter();
  const { token } = router.query;
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await fetch(`/api/signature/verify?token=${encodeURIComponent(token)}`);
      const j = await r.json();
      if (!j.valid) {
        alert(j.reason || 'Token ungültig');
        return;
      }
      setInfo(j);
      setLoading(false);
      const pad = new SignaturePad(canvasRef.current, { backgroundColor: 'rgba(255,255,255,1)' });
      padRef.current = pad;
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    })();

    function resizeCanvas() {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = 200 * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
      padRef.current?.clear();
    }

    return () => window.removeEventListener('resize', () => {});
  }, [token]);

  async function submit() {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert('Bitte unterschreiben');
      return;
    }
    const signatureBase64 = padRef.current.toDataURL('image/png');
    const geo = await getGeo();

    const resp = await fetch('/api/signature/submit', {
      method: 'POST',
      body: JSON.stringify({
        token,
        signatureBase64,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        geo
      })
    });
    const j = await resp.json();
    if (resp.ok) {
      alert('Unterschrift gespeichert. Danke!');
      window.close();
    } else {
      alert(j.error || 'Fehler beim Speichern');
    }
  }

  function clearPad() {
    padRef.current?.clear();
  }

  function getGeo() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }

  if (loading) return <div style={{ padding: 24 }}>Lade…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Dokument unterschreiben</h2>
      <p><b>Rolle:</b> {info?.role}</p>
      <p><b>Dokument:</b> {info?.documentName}</p>
      <div style={{ border: '1px solid #ccc', margin: '12px 0', width: '100%', maxWidth: 600 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 200 }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={clearPad}>Löschen</button>
        <button onClick={submit}>Unterschrift senden</button>
      </div>
      <p style={{ marginTop: 12, color: '#666' }}>
        Mit Senden stimmen Sie der digitalen Signatur mit Zeitstempel zu.
      </p>
    </div>
  );
}
