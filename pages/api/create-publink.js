// pages/api/create-publink.js
import fetch from "node-fetch"

export default async function handler(req, res) {
  try {
    const { fileid, filename } = req.body
    if (!fileid) return res.status(400).json({ error: "fileid fehlt" })

    const apiUrl = process.env.PCLOUD_API_URL || "https://eapi.pcloud.com"
    const token = process.env.PCLOUD_ACCESS_TOKEN
    if (!token) return res.status(500).json({ error: "Access Token fehlt" })

    // 1️⃣ Versuch: normalen Publink erzeugen
    const publinkRes = await fetch(`${apiUrl}/getfilepublink?fileid=${fileid}&access_token=${token}`, {
      method: "POST",
      headers: { Connection: "close" },
    })

    const publinkText = await publinkRes.text()
    let publinkData
    try {
      publinkData = JSON.parse(publinkText)
    } catch {
      console.error("❌ Ungültige JSON-Antwort:", publinkText)
      publinkData = { result: 9999 }
    }

    // Wenn Token oder Login fehlschlägt → Fallback verwenden
    if (publinkData.result !== 0) {
      console.warn("⚠️ Publink fehlgeschlagen, verwende getfilelink Fallback:", publinkData.error)

      // 2️⃣ Fallback: direkter Filelink
      const fileLinkUrl = `${apiUrl}/getfilelink?fileid=${fileid}&access_token=${token}`
      const linkRes = await fetch(fileLinkUrl)
      const linkData = await linkRes.json()

      if (linkData.result !== 0) {
        return res.status(500).json({ error: "Fallback (getfilelink) fehlgeschlagen", raw: linkData })
      }

      const host = linkData.hosts?.[0]
      const path = linkData.path
      if (!host || !path) {
        return res.status(500).json({ error: "Ungültige pCloud Antwort im Fallback", raw: linkData })
      }

      const fullUrl = `https://${host}${path}?forcedownload=1&forcename=${encodeURIComponent(filename || "Download.pdf")}`
      return res.status(200).json({ result: 0, final_url: fullUrl, fallback: true })
    }

    // 3️⃣ Reguläre Publink-Route erfolgreich
    const publinkCode = publinkData.code || publinkData.publinks?.[0]?.code
    if (!publinkCode) return res.status(500).json({ error: "Publink Code fehlt" })

    const finalUrl = `${apiUrl}/getpublinkdownload?code=${publinkCode}&forcename=${encodeURIComponent(filename || "Download.pdf")}&forcedownload=1`
    return res.status(200).json({ result: 0, final_url: finalUrl })
  } catch (err) {
    console.error("❌ Fehler in /api/create-publink:", err)
    res.status(500).json({ error: err.message })
  }
}
