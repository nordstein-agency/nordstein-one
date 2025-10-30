// pages/api/create-publink.js - Final korrigierte Version
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { fileid } = req.body;
    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" });
    }

    // Verwende api.pcloud.com als stabilen Standard-Host für API-Aufrufe
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"; 
    
    // Token-Handling
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" });
    }

    // 1. Publink Code abrufen/erstellen (getfilepublink)
    // Token wird im Query-String gesendet, was für diesen Endpunkt zu funktionieren scheint.
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`;
    console.log("📤 1. Hole/Erstelle Publink Code:", publinkUrl);

    let response = await fetch(publinkUrl, { 
        method: "POST",
        // Hinzufügen von Connection: close behebt den "socket hang up" Fehler in Serverless-Umgebungen
        headers: {
            'Connection': 'close' 
        }
    });
    
    let text = await response.text();
    
    let publinkData;
    try {
      publinkData = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Ungültige JSON-Antwort von pCloud (Code)", raw: text });
    }

    if (publinkData.result !== 0) {
      console.error("❌ Publink-Erstellung fehlgeschlagen:", publinkData.error);
      return res.status(500).json({ 
          error: publinkData.error || 'Unbekannter Fehler bei Publink-Erstellung', 
          pCloudResult: publinkData.result 
      });
    }

    // Code-Extraktion
    let publinkCode = publinkData.code 
      || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].code : null);
    
    if (!publinkCode) {
      return res.status(500).json({ error: "Publink Code konnte nicht aus der pCloud Antwort extrahiert werden." });
    }

    // 2. Erzeuge die finale, client-taugliche Download-URL.
    // 🚀 NEU: Verwende den stabilen Download-Host publnk.pcloud.com nur mit dem Code.
    // Dies behebt den Fehler "Please provide 'linkid'." und ist IP-unabhängig.
    const finalDownloadUrl = `https://publnk.pcloud.com/getpublink?code=${publinkCode}&forcedownload=1`;
    
    console.log("✅ Finaler Download-Link generiert (Direkt-Host):", finalDownloadUrl);
    
    // Gib die finale URL an den Client zurück, damit dieser den Download starten kann (window.location.href)
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