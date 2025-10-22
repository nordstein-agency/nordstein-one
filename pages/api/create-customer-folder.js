// pages/api/create-customer-folder.js
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

    // 2️⃣ pCloud Access Token abrufen
    const { data: tokenRow } = await supabase
      .from('pcloud_tokens')
      .select('access_token')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!tokenRow) return res.status(400).json({ error: 'Kein pCloud Token gefunden' })
    const accessToken = tokenRow.access_token

    // 3️⃣ pCloud API: neuen Ordner erstellen
    const parentFolderId = 19807810627 // dein "customers"-Ordner

    const folderUrl = `https://eapi.pcloud.com/createfolderifnotexists`
    const params = new URLSearchParams({
      name: customerName,
      folderid: parentFolderId,
      access_token: accessToken,
    })

    const resp = await fetch(`${folderUrl}?${params.toString()}`)
    const data = await resp.json()

    if (data.result !== 0) {
      console.error('❌ Fehler bei pCloud:', data)
      return res.status(400).json({ error: 'Fehler beim Erstellen des pCloud-Ordners', details: data })
    }

    const newFolderId = data.metadata?.folderid
    console.log(`📁 pCloud-Ordner erstellt: ${customerName} (${newFolderId})`)

    // 4️⃣ Ordner-ID in Supabase speichern
    const { error: updateError } = await supabase
      .from('customers')
      .update({ pcloud_folder_id: newFolderId })
      .eq('id', customerId)

    if (updateError) {
      console.error('❌ Fehler beim Speichern der pCloud-Ordner-ID:', updateError)
      return res.status(500).json({ error: 'Fehler beim Speichern der Ordner-ID in Supabase' })
    }

    return res.status(200).json({
      message: 'pCloud-Ordner erfolgreich erstellt',
      folderId: newFolderId,
    })
  } catch (err) {
    console.error('💥 Serverfehler beim Erstellen des pCloud-Ordners:', err)
    res.status(500).json({ error: 'Serverfehler beim Erstellen des pCloud-Ordners', details: err.message })
  }
}
