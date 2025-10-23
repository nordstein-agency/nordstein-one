// pages/api/signature/create.js
import { supabase } from '../../../lib/supabaseClient';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { customerId, customerName, documentName, folderId, role } = JSON.parse(req.body || '{}');
    if (!customerId || !customerName || !documentName || !folderId || !role) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (!['customer','executive'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // +30 Min

    const { error } = await supabase
      .from('signature_sessions')
      .insert({
        token,
        role,
        customer_id: customerId,
        customer_name: customerName,
        document_name: documentName,
        folder_id: folderId,
        expires_at: expiresAt,
      });

    if (error) return res.status(500).json({ error: 'DB insert failed' });

    // 💡 KORREKTUR: Basis-URL wird über eine Umgebungsvariable geholt.
    // Dies ist die robusteste Methode für Vercel.
    const VERCEL_URL = process.env.NEXT_PUBLIC_BASE_URL;
    
    // Fallback auf dynamische Header, falls die Umgebungsvariable nicht gesetzt ist.
    const dynamicOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    
    // Verwende die Umgebungsvariable, wenn sie existiert, sonst den dynamischen Wert.
    const origin = VERCEL_URL || dynamicOrigin;
    
    // Stelle sicher, dass die URL https://one.nordstein-agency.com/sign?token=... ist.
    const qrUrl = `${origin}/sign?token=${encodeURIComponent(token)}`;

    res.status(200).json({ qrUrl, token, expiresAt });
  } catch (e) {
    console.error('signature/create error', e);
    res.status(500).json({ error: 'Server error' });
  }
}