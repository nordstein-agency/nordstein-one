// pages/api/create-publink.js - Final korrigierte Version

import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { fileid } = req.body;
    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" });
    }

    // 💡 Korrektur 1: Verwende api.pcloud.com als Standard-Host, um Stabilität zu erhöhen
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"; 
    
    // Nutzen Sie den Access Token aus den Umgebungsvariablen
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" });
    }

    // 1. Publink Code abrufen/erstellen (getfilepublink)
    // ⚠️ Rückkehr zur funktionierenden URL-Struktur (Token im Query-String)
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`;
    console.log("📤 1. Hole/Erstelle Publink Code:", publinkUrl);

    let response = await fetch(publinkUrl, { 
        method: "POST",
        // 💡 Korrektur 2: Füge Connection: close hinzu, um den "socket hang up" Fehler zu beheben
        headers: {
            'Connection': 'close' 
        }
        // Body bleibt leer, da alle Parameter in der URL sind
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

    // Code-Extraktion: Nimmt den direkten 'code' oder den Code aus dem 'publinks'-Array
    let publinkCode = publinkData.code 
      || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].code : null);
    
    if (!publinkCode) {
      return res.status(500).json({ error: "Publink Code konnte nicht aus der pCloud Antwort extrahiert werden." });
    }

    // 2. Erzeuge die finale, client-taugliche Download-URL.
    // Beibehalten des IP-unabhängigen Fixes
    const finalDownloadUrl = `${apiUrl}/getpublink?code=${publinkCode}&fileid=${fileid}&forcedownload=1`;
    
    console.log("✅ Finaler Download-Link generiert (IP-unabhängig):", finalDownloadUrl);
    
    // Wir geben die finale URL an den Client zurück
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