// pages/api/signature/verify.js
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false, reason: 'Missing token' });

    const { data, error } = await supabase
      .from('signature_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) return res.status(404).json({ valid: false, reason: 'Not found' });

    if (data.used) return res.status(400).json({ valid: false, reason: 'Already used' });
    if (new Date(data.expires_at) < new Date()) return res.status(400).json({ valid: false, reason: 'Expired' });

    res.status(200).json({
      valid: true,
      role: data.role,
      customerId: data.customer_id,
      customerName: data.customer_name,
      documentName: data.document_name,
      folderId: data.folder_id
    });
  } catch (e) {
    console.error('signature/verify error', e);
    res.status(500).json({ valid: false, reason: 'Server error' });
  }
}
