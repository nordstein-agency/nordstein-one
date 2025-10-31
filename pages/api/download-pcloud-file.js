// /pages/api/download-pcloud-file.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  try {
    const encodedPath = encodeURIComponent(path);
    const apiUrl = `${process.env.PCLOUD_API_URL}/getfilelink?path=${encodedPath}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`;
    console.log("📡 Abruf von pCloud-Link:", apiUrl);

    // Schritt 1: Datei-Link von pCloud holen
    const metaResp = await fetch(apiUrl);
    const metaData = await metaResp.json();

    if (metaData.result !== 0) {
      console.error("❌ pCloud API-Fehler:", metaData);
      return res.status(500).json({ error: "Fehler beim pCloud-Link", debug: metaData });
    }

    // Schritt 2: Direkt-Download-Link bauen
    const host = metaData.hosts?.[0];
    const fileUrl = `https://${host}${metaData.path}`;
    console.log("✅ Lade Datei von:", fileUrl);

    // Schritt 3: Datei vom pCloud-Server holen (Server-zu-Server)
    const fileResp = await fetch(fileUrl);

    if (!fileResp.ok) {
      const text = await fileResp.text();
      throw new Error(`Download fehlgeschlagen: ${text}`);
    }

    // Header für Download setzen
    res.setHeader("Content-Type", fileResp.headers.get("content-type") || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${path.split("/").pop()}"`);

    // Stream direkt an den Browser weitergeben
    const buffer = Buffer.from(await fileResp.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("❌ Download-Fehler:", err);
    res.status(500).json({ error: err.message });
  }
}
