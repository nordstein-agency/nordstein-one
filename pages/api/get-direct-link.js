// pages/api/get-direct-link.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { customerName, fileName } = req.query;

    if (!customerName || !fileName) {
      return res.status(400).json({ error: "Missing customerName or fileName." });
    }

    const apiUrl = process.env.PCLOUD_API_URL;
    const token = process.env.PCLOUD_ACCESS_TOKEN;

    // 🧩 Pfad korrekt zusammensetzen
    const fullPath = `/customers/${decodeURIComponent(customerName)}/${decodeURIComponent(fileName)}`;
    console.log(`🔗 Suche Datei über Pfad: ${fullPath}`);

    const url = `${apiUrl}/getfilelink?path=${encodeURIComponent(fullPath)}&access_token=${token}`;
    const resp = await fetch(url);
    const data = await resp.json();

    console.log("pCloud getfilelink response:", data);

    if (data.result !== 0 || !data?.hosts?.length) {
      console.error("❌ Fehler beim Abrufen des Links:", data);
      return res.status(404).json({ error: "File not found.", debug: data });
    }

    const directUrl = `https://${data.hosts[0]}${data.path}`;
    return res.status(200).json({ ok: true, directUrl });
  } catch (err) {
    console.error("❌ Fehler in get-direct-link:", err);
    res.status(500).json({ error: err.message });
  }
}
