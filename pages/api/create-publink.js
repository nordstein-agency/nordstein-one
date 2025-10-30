// pages/api/create-publink.js
import fetch from "node-fetch"

export default async function handler(req, res) {
  try {
    const { fileid, filename } = req.body
    if (!fileid) return res.status(400).json({ error: "fileid fehlt" })

    const apiUrl = process.env.PCLOUD_API_URL || "https://eapi.pcloud.com"
    const token = process.env.PCLOUD_ACCESS_TOKEN
    if (!token) return res.status(500).json({ error: "Access Token fehlt" })

    // 1️⃣ Publink erstellen oder abrufen
    const publinkRes = await fetch(`${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`, {
      method: "POST",
      headers: { Connection: "close" },
    })
    const publinkData = await publinkRes.json()

    if (publinkData.result !== 0) {
      console.error("❌ Publink-Erstellung fehlgeschlagen:", publinkData)
      return res.status(500).json({ error: publinkData.error || "Publink-Erstellung fehlgeschlagen" })
    }

    // 2️⃣ Code extrahieren
    const publinkCode =
      publinkData.code ||
      (Array.isArray(publinkData.publinks) && publinkData.publinks[0]?.code)
    if (!publinkCode) return res.status(500).json({ error: "Publink-Code fehlt" })

    // 3️⃣ Richtigen CDN-Link holen
    const infoRes = await fetch(`${apiUrl}/getpublink?code=${publinkCode}&access_token=${token}`)
    const infoData = await infoRes.json()

    if (infoData.result !== 0) {
      console.error("❌ getpublink fehlgeschlagen:", infoData)
      return res.status(500).json({ error: infoData.error || "Fehler bei getpublink" })
    }

    const downloadLink = infoData.downloadlink || infoData.metadata?.downloadlink
    if (!downloadLink) {
      return res.status(500).json({ error: "Kein downloadlink im getpublink Ergebnis" })
    }

    const finalUrl = `${downloadLink}?forcedownload=1&forcename=${encodeURIComponent(filename || "Download.pdf")}`
    return res.status(200).json({ result: 0, final_url: finalUrl })
  } catch (err) {
    console.error("❌ Fehler in /api/create-publink:", err)
    res.status(500).json({ error: err.message })
  }
}
