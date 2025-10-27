// pages/api/create-publink.js - KORRIGIERT FÜR DIREKTEN DOWNLOAD
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { fileid } = req.body;
    if (!fileid) return res.status(400).json({ error: "fileid fehlt" });

    const apiUrl = process.env.PCLOUD_API_URL || "https://eapi.pcloud.com"; 
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) return res.status(500).json({ error: "Access Token fehlt" });

    // 1. Publink Code abrufen/erstellen (getfilepublink)
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`;
    console.log("📤 1. Hole/Erstelle Publink Code:", publinkUrl);
    
    let response = await fetch(publinkUrl, { method: "POST" });
    let text = await response.text();
    
    let publinkData;
    try {
      publinkData = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Ungültige Antwort von pCloud (Code)", raw: text });
    }

    if (publinkData.result !== 0) {
      console.error("❌ Publink-Erstellung fehlgeschlagen:", publinkData.error);
      return res.status(500).json({ error: publinkData.error, pCloudResult: publinkData.result });
    }

    let publinkCode = publinkData.code 
      || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].code : null);
    
    if (!publinkCode) {
      return res.status(500).json({ error: "Publink Code konnte nicht extrahiert werden." });
    }

    // 2. Direkten Download-Link anfordern (getpublinkdownload)
    // Dieser Aufruf gibt die Server-IP, den Pfad und die Ticket-ID für den direkten Download zurück
    const downloadApiUrl = `${apiUrl}/getpublinkdownload?code=${publinkCode}&skipauthorization=1`;
    console.log("📤 2. Fordere direkten Download-Link an:", downloadApiUrl);

    let downloadRes = await fetch(downloadApiUrl, { method: "POST" });
    let downloadData = await downloadRes.json();

    if (downloadData.result !== 0 || !Array.isArray(downloadData.hosts) || !downloadData.path) {
        console.error("❌ Direkter Download-Link fehlgeschlagen:", downloadData.error);
        return res.status(500).json({ error: "Direkter Download-Link konnte nicht generiert werden.", pCloudResult: downloadData.result });
    }

    // 3. Finale Download-URL zusammenstellen
    const downloadHost = downloadData.hosts[0];
    const finalDownloadUrl = `https://${downloadHost}${downloadData.path}`;
    
    console.log("✅ Finaler Download-Link generiert:", finalDownloadUrl);
    
    // Wir geben die finale URL zurück, damit create-concept.js sie speichern kann
    // Wir verwenden hier ein neues Feld 'final_url' und den Code als Fallback.
    return res.status(200).json({ 
        result: 0, 
        code: publinkCode,
        final_url: finalDownloadUrl
    });

  } catch (err) {
    console.error("❌ Allgemeiner Fehler in /api/create-publink:", err);
    return res.status(500).json({ error: err.message });
  }
}