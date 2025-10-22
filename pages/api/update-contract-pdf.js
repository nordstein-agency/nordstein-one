import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('❌ Falsche Methode:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, pdfUrl } = req.body
  console.log('📩 API Request Body:', req.body)

  if (!id || !pdfUrl) {
    console.warn('⚠️ Fehlende Parameter:', { id, pdfUrl })
    return res.status(400).json({ error: 'Missing parameters' })
  }

  try {
    console.log('🧩 Starte Update in Supabase:', { id, pdfUrl })

    const { data, error } = await supabaseAdmin
      .from('contracts')
      .update({ pdf_url: pdfUrl })
      .eq('id', id)
      .select('*')

    console.log('📡 Supabase Antwort:', { data, error })

    if (error) throw error

    if (!data || data.length === 0) {
      console.warn('⚠️ Kein Datensatz aktualisiert.')
      return res.status(404).json({ error: 'No contract found for this ID' })
    }

    return res.status(200).json({ success: true, updated: data })
  } catch (err) {
    console.error('❌ Fehler beim Update pdf_url:', err)
    return res.status(500).json({ error: err.message })
  }
}
