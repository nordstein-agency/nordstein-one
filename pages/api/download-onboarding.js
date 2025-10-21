// pages/api/download-onboarding.js
import { google } from 'googleapis'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    const { projectId } = req.query
    if (!projectId) return res.status(400).json({ error: 'projectId fehlt' })

    // 1) Projektdaten holen
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('id, title, customer_id')
      .eq('id', projectId)
      .single()
    if (pErr || !project) return res.status(404).json({ error: 'Projekt nicht gefunden' })

    // 2) Kundendaten holen
    const { data: customer, error: cErr } = await supabase
      .from('customers')
      .select('name')
      .eq('id', project.customer_id)
      .single()
    if (cErr || !customer) return res.status(404).json({ error: 'Kunde nicht gefunden' })

    const customerName = (customer.name || '').trim()
    const projectName  = (project.title || '').trim()

    // 3) Google Auth (Servicekonto)
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GCP_PROJECT_ID,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GCP_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })
    const drive = google.drive({ version: 'v3', auth })

    // 4) Kundenordner (per Name) finden
    const customerFolderQ = `name='${customerName}' and mimeType='application/vnd.google-apps.folder'`
    const { data: cust } = await drive.files.list({ q: customerFolderQ, fields: 'files(id,name,parents)' })
    if (!cust.files?.length) return res.status(404).json({ error: 'Kundenordner nicht gefunden' })
    const customerFolderId = cust.files[0].id

    // 5) Projektordner unter Kundenordner finden
    const projectFolderQ = `name='${projectName}' and mimeType='application/vnd.google-apps.folder' and '${customerFolderId}' in parents`
    const { data: proj } = await drive.files.list({ q: projectFolderQ, fields: 'files(id,name)' })
    if (!proj.files?.length) return res.status(404).json({ error: 'Projektordner nicht gefunden' })
    const projectFolderId = proj.files[0].id

    // 6) Datei "onboarding.pdf" im Projektordner finden
    const fileQ = `name='onboarding.pdf' and '${projectFolderId}' in parents`
    const { data: fileRes } = await drive.files.list({ q: fileQ, fields: 'files(id,name)' })
    if (!fileRes.files?.length) return res.status(404).json({ error: 'onboarding.pdf nicht gefunden' })
    const fileId = fileRes.files[0].id

    // 7) Stream an den Browser
    const streamRes = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
    res.setHeader('Content-Disposition', 'attachment; filename="onboarding.pdf"')
    res.setHeader('Content-Type', 'application/pdf')
    streamRes.data.pipe(res)
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).json({ error: 'Serverfehler beim Datei-Download' })
  }
}
