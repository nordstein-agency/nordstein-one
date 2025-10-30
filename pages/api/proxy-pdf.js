// /pages/api/proxy-pdf.js
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const config = {
  api: {
    bodyParser: false, // wichtig! sonst cached Next.js alles im RAM
  },
};

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    console.log('🌍 Starte Proxy-Abruf:', url);

    // Hole Datei direkt von pCloud (Server-zu-Server)
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ pCloud-Fehler:', text);
      return res.status(response.status).json({ error: text });
    }

    // Original-Header beibehalten (Content-Type, Länge usw.)
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);

    // ⬇️ Direkt-Streaming (kein Buffer mehr!)
    const body = response.body;
    if (!body) {
      console.error('❌ Proxy-Fehler: Leerer Response-Stream');
      return res.status(500).json({ error: 'Empty response stream' });
    }

    const nodeStream = Readable.fromWeb(body);
    await pipeline(nodeStream, res);

    console.log('✅ Proxy-Stream erfolgreich beendet.');
  } catch (err) {
    console.error('❌ Proxy-Fehler:', err);
    res.status(500).json({ error: err.message });
  }
}
