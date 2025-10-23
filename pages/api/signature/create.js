// pages/api/signature/create.js
import { supabase } from '../../../lib/supabaseClient';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // req.body wird von Next.js automatisch geparst, wir destrukturieren es direkt.
    const { customerId, customerName, documentName, folderId, role } = req.body || {};
    
    // 💡 KORRIGIERTE PRÜFUNG: Prüft nur die zwingend benötigten Felder.
    // customerId und folderId sind laut DB-Schema nullable und werden hier ausgelassen.
    if (!customerName || !documentName || !role) {
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
        // customerId und folderId werden hier eingefügt. 
        // Wenn sie undefined sind, setzt Supabase automatisch NULL.
        customer_id: customerId, 
        customer_name: customerName,
        document_name: documentName,
        folder_id: folderId,
        expires_at: expiresAt,
      });

    if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: 'DB insert failed' });
    }

    // Link-Generierung (Verwendet Umgebungsvariable als Fallback)
    const VERCEL_URL = process.env.NEXT_PUBLIC_BASE_URL;
    const dynamicOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const origin = VERCEL_URL || dynamicOrigin;
    
    // Generiert den korrekten Link mit ?token=...
    const qrUrl = `${origin}/sign?token=${encodeURIComponent(token)}`;

    res.status(200).json({ qrUrl, token, expiresAt });
  } catch (e) {
    console.error('signature/create final catch error', e);
    res.status(500).json({ error: 'Server error' });
  }
}