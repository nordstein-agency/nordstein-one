// /pages/api/download-pcloud-file.js
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Missing path parameter' });

  try {
    console.log('📦 Lade Datei direkt aus pCloud:', path);

    // 🔹 Erzeuge den Download-Link serverseitig über API-Token (Vercel-IP!)
    const apiUrl = `${process.env.PCLOUD_API_URL}/getfilelink?path=${encodeURIComponent(
      path
    )}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`;

    const resp = await fetch(apiUrl);
    const data = await resp.json();

    if (data.result !== 0 || !data.hosts?.length || !data.path) {
      console.error('❌ Fehler beim Erzeugen des pCloud-Links:', data);
      return res.status(500).json({ error: 'Fehler beim pCloud-Link', debug: data });
    }

    // 🔹 Download-Link aus hosts und path bauen
    const host = data.hosts[0];
    const fileUrl = `https://${host}${data.path}`;

    console.log('✅ Direkter Download-Link:', fileUrl);

    // 🔹 Datei abrufen
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) {
      const text = await fileResp.text();
      console.error('❌ Fehler beim Abrufen der Datei:', text);
      return res.status(fileResp.status).json({ error: text });
    }

    const contentType = fileResp.headers.get('content-type') || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');

    const body = fileResp.body;
    if (!body) return res.status(500).json({ error: 'Empty response stream' });

    const nodeStream = Readable.fromWeb(body);
    await pipeline(nodeStream, res);
  } catch (err) {
    console.error('❌ Proxy-Fehler:', err);
    res.status(500).json({ error: err.message });
  }
}
