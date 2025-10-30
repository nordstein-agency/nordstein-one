// pages/api/create-publink.js - Final korrigierte Version (inkl. URL-Syntax Fix)

import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { fileid } = req.body;
    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" });
    }

    // 1. Setup und Token-Check
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"; 
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN; 
    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" });
    }

    // --- 1. Publink Code abrufen/erstellen (getfilepublink) ---
    // Token wird im Query-String gesendet.
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`;
    console.log("📤 1. Hole/Erstelle Publink Code:", publinkUrl);

    let response = await fetch(publinkUrl, { 
        method: "POST",
        // Behebt den "socket hang up" Fehler in Serverless-Umgebungen
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

    // --- 2. Finale Download-URL generieren ---
    
    // 💡 Platzhalter für den Dateinamen. Passen Sie dies an, um den gewünschten Namen zu erhalten!
    // IDEAL: Sie würden den Namen des Konzepts/Projekts aus der Datenbank abrufen.
    const desiredFilename = "Download_Dokument.pdf";
    
    // 🚀 FINALE KORREKTUR: Verwende den stabilen Download-Host (publnk) 
    // und füge den 'forcename' Parameter KORREKT mit '&' an.
    const finalDownloadUrl = `https://publnk.pcloud.com/getpublink?code=${publinkCode}&forcedownload=1&forcename=${encodeURIComponent(desiredFilename)}`;
    
    console.log("✅ Finaler Download-Link generiert:", finalDownloadUrl);
    
    // Gib die finale URL an den Client zurück
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