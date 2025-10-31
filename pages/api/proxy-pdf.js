// /pages/api/proxy-pdf.js
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing ?url parameter' });

    console.log('🌍 Proxy starte Download von:', url);

    // Hole Datei direkt vom pCloud-CDN
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ pCloud antwortet mit Fehler:', text);
      return res.status(response.status).json({ error: text });
    }

    // Header übernehmen
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentLength = response.headers.get('content-length');
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'no-store');

    // Stream weiterleiten
    const body = response.body;
    if (!body) return res.status(500).json({ error: 'Leerer pCloud-Stream' });

    const nodeStream = Readable.fromWeb(body);
    await pipeline(nodeStream, res);
  } catch (err) {
    console.error('❌ Proxy-Fehler:', err);
    res.status(500).json({ error: err.message });
  }
}
