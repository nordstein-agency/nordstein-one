// lib/pcloudToken.js
import { supabase } from './supabaseClient'

export async function getPCloudAccessToken() {
  const { data, error } = await supabase
    .from('pcloud_tokens')
    .select('access_token, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error('Supabase Token-Select fehlgeschlagen')
  return data?.access_token || null
}
