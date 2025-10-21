import { google } from 'googleapis'
import fetch from 'node-fetch'
import { Readable } from 'stream'

export default async function handler(req, res) {
  console.log("📩 Neue Anfrage erhalten:", req.method, req.body)

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { customerName, files } = req.body
    if (!customerName || !files || files.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // 🔐 Authentifizierung über Service Account (labnol.org Methode)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // 🔎 Kundenordner suchen
    const safeName = customerName.trim()
    console.log(`🔍 Suche nach Ordner: ${safeName}`)

    const folderList = await drive.files.list({
      q: `'${process.env.GCP_CUSTOMERS_ROOT_FOLDER_ID}' in parents and name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
    })

    if (!folderList.data.files?.length) {
      console.error(`❌ Kein Ordner für ${customerName} gefunden`)
      return res.status(404).json({ message: `Kundenordner für ${customerName} nicht gefunden` })
    }

    const customerFolderId = folderList.data.files[0].id
    console.log(`📁 Kundenordner gefunden: ${customerName} (${customerFolderId})`)

    // 🔽 Dateien laden & hochladen
    const uploadedFiles = []

    for (const fileName of files) {
      const fileUrl = `https://qtniwqhmnfgftaqioinb.supabase.co/storage/v1/object/public/concept_templates/contract_templates/${fileName}.pdf`
      console.log(`⬆️ Lade Datei: ${fileUrl}`)

      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error(`Fehler beim Laden der Datei ${fileName}`)

      const buffer = Buffer.from(await response.arrayBuffer())
      const stream = Readable.from(buffer)
      console.log(`📦 Datei geladen (${buffer.length} Bytes)`)

      const upload = await drive.files.create({
        requestBody: { name: `${fileName}.pdf`, parents: [customerFolderId] },
        media: { mimeType: 'application/pdf', body: stream },
        fields: 'id, name, parents',
        supportsAllDrives: true,
      })

      uploadedFiles.push(upload.data.name)
      console.log(`✅ Erfolgreich hochgeladen: ${upload.data.name}`)
    }

    res.status(200).json({
      message: `Dokumente erfolgreich in ${customerName} hochgeladen.`,
      uploadedFiles,
    })
  } catch (error) {
    console.error('❌ Fehler beim Hochladen in Google Drive:', error)
    res.status(500).json({
      message: 'Fehler beim Hochladen in Google Drive',
      error: error.message,
    })
  }
}
