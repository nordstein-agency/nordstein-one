// pages/api/create-publink.js - Final korrigierte Version
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { fileid, filename } = req.body; 
    
    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" });
    }

    // --- 1. Setup und Token-Check ---
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"; 
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" });
    }

    // --- getfilepublink Aufruf ---
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

    // 🚀 KORREKTUR: Extrahiere code UND linkid
    let publinkCode = publinkData.code 
      || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].code : null);
    
    let publinkId = publinkData.linkid 
      || (Array.isArray(publinkData.publinks) && publinkData.publinks.length > 0 ? publinkData.publinks[0].linkid : null);
    
    if (!publinkCode || !publinkId) {
      return res.status(500).json({ error: "Publink Code oder ID (linkid) konnte nicht aus der pCloud Antwort extrahiert werden." });
    }

    // --- 2. Finale Download-URL generieren ---
    const downloadFilename = filename ? filename : "Download.pdf";
    
    // 🚀 FINALE URL: Verwendet /getpublinkdownload, um ENOTFOUND/Log-in/linkid-Fehler auf dem API-Host zu beheben.
    const finalDownloadUrl = `${apiUrl}/getpublinkdownload?code=${publinkCode}&linkid=${publinkId}&forcename=${encodeURIComponent(downloadFilename)}&access_token=${token}`;
    
    res.setHeader('Content-Type', 'application/json');
    
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