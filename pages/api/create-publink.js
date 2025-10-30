// pages/api/create-publink.js
import fetch from "node-fetch"

export default async function handler(req, res) {
  try {
    const { fileid, filename } = req.body
    if (!fileid) return res.status(400).json({ error: "fileid fehlt" })

    const apiUrl = process.env.PCLOUD_API_URL || "https://eapi.pcloud.com"
    const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN
    if (!token) return res.status(500).json({ error: "Access Token fehlt" })

    // 1️⃣ Publink erstellen oder vorhandenen holen
    const publinkRes = await fetch(`${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`, {
      method: "POST",
      headers: { Connection: "close" }
    })
    const publinkText = await publinkRes.text()
    let publinkData
    try {
      publinkData = JSON.parse(publinkText)
    } catch {
      return res.status(500).json({ error: "Ungültige JSON-Antwort von pCloud", raw: publinkText })
    }

    if (publinkData.result !== 0) {
      return res.status(500).json({ error: publinkData.error || "Publink-Erstellung fehlgeschlagen", raw: publinkData })
    }

    const publinkCode =
      publinkData.code ||
      (Array.isArray(publinkData.publinks) && publinkData.publinks[0]?.code)
    if (!publinkCode) return res.status(500).json({ error: "Publink-Code fehlt" })

    // 2️⃣ Echten Public-Link-Host abrufen
    const infoRes = await fetch(`${apiUrl}/getpublink?code=${publinkCode}&access_token=${token}`)
    const infoText = await infoRes.text()
    let infoData
    try {
      infoData = JSON.parse(infoText)
    } catch {
      return res.status(500).json({ error: "Ungültige JSON-Antwort in getpublink", raw: infoText })
    }

    if (infoData.result !== 0) {
      return res.status(500).json({ error: infoData.error || "Fehler bei getpublink", raw: infoData })
    }

    const downloadBase = infoData.downloadlink || infoData.metadata?.downloadlink
    if (!downloadBase) {
      return res.status(500).json({ error: "Kein downloadlink gefunden", raw: infoData })
    }

    const downloadFilename = encodeURIComponent(filename || "Download.pdf")
    const finalUrl = `${downloadBase}?forcedownload=1&forcename=${downloadFilename}`

    res.status(200).json({ result: 0, code: publinkCode, final_url: finalUrl })
  } catch (err) {
    console.error("❌ Fehler in /api/create-publink:", err)
    res.status(500).json({ error: err.message })
  }
}
