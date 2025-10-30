// pages/api/create-publink.js - Final korrigierte Version
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // 💡 NEU: Erfasse den Dateinamen aus dem Request-Body
    const { fileid, filename } = req.body; 
    
    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" });
    }

    // --- 1. Setup und Token-Check ---
    // Verwende den stabilen API-Host für alle API-Interaktionen
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"; 
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" });
    }

    // --- getfilepublink Aufruf ---
    // Token wird im Query-String gesendet (behebt Authentifizierungsfehler)
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`;
    let response = await fetch(publinkUrl, { 
        method: "POST",
        headers: { 'Connection': 'close' } // Fix für "socket hang up"
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
      return res.status(500).json({ error: publinkData.error, pCloudResult: publinkData.result });
    }
    let publinkCode = publinkData.code || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].code : null);
    if (!publinkCode) {
      return res.status(500).json({ error: "Publink Code konnte nicht extrahiert werden." });
    }

    // --- 2. Finale Download-URL generieren ---
    const downloadFilename = filename ? filename : "Download.pdf";
    
    // 🚀 FINALE URL: Nutzt den stabilen API-Host, Public Link Code UND Access Token
    const finalDownloadUrl = `${apiUrl}/getpublink?code=${publinkCode}&forcedownload=1&forcename=${encodeURIComponent(downloadFilename)}&access_token=${token}`;
    
    res.setHeader('Content-Type', 'application/json'); // Fix für Encoding-Probleme
    
    return res.status(200).json({ 
        result: 0, 
        code: publinkCode,
        final_url: finalDownloadUrl
    });

  } catch (err) {
    console.error("❌ Allgemeiner Fehler in /api/create-publink:", err);
    res.status(500).json({ error: err.message });
  }
}