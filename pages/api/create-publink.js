// pages/api/create-publink.js
import fetch from "node-fetch"

export default async function handler(req, res) {
  try {
    const { fileid, filename } = req.body

    if (!fileid) {
      return res.status(400).json({ error: "fileid fehlt" })
    }

    // --- 1️⃣ Setup ---
    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com"
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN

    if (!token) {
      return res.status(500).json({ error: "Access Token fehlt" })
    }

    // --- 2️⃣ Publink erzeugen (falls nicht vorhanden) ---
    const publinkUrl = `${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`

    const publinkRes = await fetch(publinkUrl, {
      method: "POST",
      headers: { Connection: "close" } // Fix für "socket hang up"
    })

    const publinkText = await publinkRes.text()
    let publinkData
    try {
      publinkData = JSON.parse(publinkText)
    } catch {
      return res.status(500).json({
        error: "Ungültige JSON-Antwort von pCloud (getfilepublink)",
        raw: publinkText
      })
    }

    if (publinkData.result !== 0) {
      console.error("❌ Publink-Erstellung fehlgeschlagen:", publinkData.error)
      return res.status(500).json({
        error: publinkData.error,
        pCloudResult: publinkData.result
      })
    }

    // --- 3️⃣ Code extrahieren ---
    const publinkCode =
      publinkData.code ||
      (Array.isArray(publinkData.publinks) && publinkData.publinks[0]?.code)

    if (!publinkCode) {
      return res
        .status(500)
        .json({ error: "Publink-Code fehlt in der pCloud-Antwort." })
    }

    // --- 4️⃣ Echten Public-Link-Host abfragen ---
    const infoUrl = `${apiUrl}/getpublink?code=${publinkCode}&access_token=${token}`
    const infoRes = await fetch(infoUrl)
    const infoText = await infoRes.text()

    let infoData
    try {
      infoData = JSON.parse(infoText)
    } catch {
      return res
        .status(500)
        .json({ error: "Ungültige JSON-Antwort in getpublink", raw: infoText })
    }

    if (infoData.result !== 0) {
      return res
        .status(500)
        .json({ error: "Fehler bei getpublink", pCloudResult: infoData.result })
    }

    const downloadBase =
      infoData.downloadlink || infoData.metadata?.downloadlink

    if (!downloadBase) {
      return res.status(500).json({
        error: "Kein downloadlink in getpublink Response gefunden",
        raw: infoData
      })
    }

    // --- 5️⃣ Finale Download-URL bauen ---
    const downloadFilename = encodeURIComponent(filename || "Download.pdf")
    const finalDownloadUrl = `${downloadBase}?forcedownload=1&forcename=${downloadFilename}`

    // --- 6️⃣ Erfolg ---
    return res.status(200).json({
      result: 0,
      code: publinkCode,
      final_url: finalDownloadUrl
    })
  } catch (err) {
    console.error("❌ Allgemeiner Fehler in /api/create-publink:", err)
    res.status(500).json({ error: err.message })
  }
}
