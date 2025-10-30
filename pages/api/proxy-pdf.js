// /pages/api/proxy-pdf.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    console.log("🌍 Starte Proxy-Abruf:", url);

    // 🔹 Datei von pCloud abrufen (dein Server-IP → kein IP-Mismatch mehr)
    const response = await fetch(url, {
      method: "GET",
      headers: {
        // Optional: Authentifizierung, falls erforderlich
        Authorization: `Bearer ${process.env.PCLOUD_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ pCloud-Fehler:", text);
      return res.status(response.status).json({ error: text });
    }

    // 🔹 Content-Type weitergeben (z. B. application/pdf)
    const contentType = response.headers.get("content-type") || "application/pdf";
    res.setHeader("Content-Type", contentType);

    // 🔹 Daten streamen
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.status(200).send(buffer);
  } catch (err) {
    console.error("❌ Proxy-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
}
