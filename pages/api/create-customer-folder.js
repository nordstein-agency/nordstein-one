// pages/api/create-customer-folder.js
import { google } from 'googleapis'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    const { customerId } = req.body
    if (!customerId) return res.status(400).json({ error: 'customerId fehlt' })

    // 1️⃣ Kundenname aus Supabase holen
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single()
    if (error || !customer) return res.status(404).json({ error: 'Kunde nicht gefunden' })

    const customerName = (customer.name || '').trim()

    // 2️⃣ Google-Auth vorbereiten
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GCP_PROJECT_ID,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GCP_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    })
    const drive = google.drive({ version: 'v3', auth })

    // 3️⃣ Hauptordner-ID aus Umgebungsvariable
    const parentId = process.env.GCP_CUSTOMERS_ROOT_FOLDER_ID

    // 4️⃣ Prüfen, ob Ordner schon existiert
    const query = `name='${customerName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents`
    const { data: existing } = await drive.files.list({ q: query, fields: 'files(id,name)' })
    if (existing?.files?.length) {
      return res.status(200).json({ message: 'Ordner existiert bereits', folderId: existing.files[0].id })
    }

    // 5️⃣ Ordner erstellen
    const fileMetadata = {
      name: customerName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }

    const { data: folder } = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name',
    })

    // 6️⃣ Ordner-ID in Supabase speichern
    const { error: updateError } = await supabase
      .from('customers')
      .update({ drive_folder_id: folder.id })
      .eq('id', customerId)
    if (updateError) console.error('Fehler beim Speichern der Drive-Ordner-ID:', updateError)

    return res.status(200).json({ message: 'Drive-Ordner erstellt', folderId: folder.id })
  } catch (err) {
    console.error('Drive-Ordner-Fehler:', err)
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Drive-Ordners' })
  }
}
