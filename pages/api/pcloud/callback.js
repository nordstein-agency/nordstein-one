// pages/api/pcloud/callback.js
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  try {
    const { code } = req.query

    console.log("🧩 pCloud Callback aufgerufen:", req.query)
    console.log("🌍 Redirect URI:", process.env.PCLOUD_REDIRECT_URI)


    if (!code) return res.status(400).send('Missing code')

    const qs = new URLSearchParams({
      client_id: process.env.PCLOUD_CLIENT_ID,
      client_secret: process.env.PCLOUD_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.PCLOUD_REDIRECT_URI,
    })

    const resp = await fetch(`https://eapi.pcloud.com/oauth2_token?${qs.toString()}`)
    const data = await resp.json()
    if (!data?.access_token) {
      console.error('pCloud OAuth error:', data)
      return res.status(400).send('OAuth failed')
    }

    // Access-Token speichern
    const { error } = await supabase.from('pcloud_tokens').insert({ access_token: data.access_token })
    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).send('Token save failed')
    }

    // zurück ins Dashboard (oder wohin du willst)
    res.redirect('/dashboard?connected=pcloud')
  } catch (e) {
    console.error(e)
    res.status(500).send('Server error')
  }
}
