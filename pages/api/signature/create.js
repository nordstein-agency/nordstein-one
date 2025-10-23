// pages/api/signature/create.js
import { supabase } from '../../../lib/supabaseClient';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // ❌ ENTFERNT: const { customerId, customerName, documentName, folderId, role } = JSON.parse(req.body || '{}');
    
    // ✅ KORREKTUR: req.body ist in Next.js bereits das geparste Objekt.
    const { customerId, customerName, documentName, folderId, role } = req.body || {};
    
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

    if (error) {
        // 💡 Wenn hier ein DB-Fehler auftritt (z.B. falscher Datentyp), 
        // wird er jetzt korrekt geloggt und der Frontend-Fehler ist spezifischer.
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: 'DB insert failed' });
    }

    // ... (Link-Generierung bleibt korrekt)
    const VERCEL_URL = process.env.NEXT_PUBLIC_BASE_URL;
    const dynamicOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const origin = VERCEL_URL || dynamicOrigin;
    const qrUrl = `${origin}/sign?token=${encodeURIComponent(token)}`;

    res.status(200).json({ qrUrl, token, expiresAt });
  } catch (e) {
    console.error('signature/create final catch error', e);
    // Dieser Fehler sollte nach der Korrektur nicht mehr auftreten, 
    // dient aber als Fallback für unbekannte Probleme.
    res.status(500).json({ error: 'Server error' });
  }
}