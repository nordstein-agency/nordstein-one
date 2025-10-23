// /pages/api/signature/create.js
import { supabase } from '../../../lib/supabaseClient';
import { nanoid } from 'nanoid'; // Behält den Original-Import bei

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // req.body wird von Next.js automatisch geparst, wir destrukturieren es direkt.
    // ✅ NEU: signaturePosition wird aus dem Body entnommen
    const { customerId, customerName, documentName, folderId, role, signaturePosition } = req.body || {};
    
    // 💡 ANGEPASSTE PRÜFUNG: Jetzt signaturePosition prüfen, wenn sie für das Dokument zwingend ist
    if (!customerName || !documentName || !role || !signaturePosition) {
        // HINWEIS: customerId/folderId sind nullable, signaturePosition ist jetzt zwingend, 
        // weil das Frontend sie immer senden muss.
        return res.status(400).json({ error: 'Missing required fields (customerName, documentName, role, signaturePosition)' });
    }
    if (!['customer','executive'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 2. Token generieren (wie in der alten Version)
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // +30 Min

    // 3. Session in der Datenbank speichern
    const { error } = await supabase
      .from('signature_sessions')
      .insert({
        token,
        role,
        customer_id: customerId, 
        customer_name: customerName,
        document_name: documentName,
        folder_id: folderId,
        // ✅ DER WICHTIGE FIX: Speichern der dynamischen Position
        signature_position: signaturePosition,
        expires_at: expiresAt,
        used: false, // Fügt das 'used' Feld hinzu, falls es fehlt
      });

    if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: 'DB insert failed' });
    }

    // 4. Link-Generierung (WIE IN DER ALTEN, FUNKTIONIERENDEN VERSION)
    const VERCEL_URL = process.env.NEXT_PUBLIC_BASE_URL;
    const dynamicOrigin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const origin = VERCEL_URL || dynamicOrigin;
    
    // Generiert den korrekten Link ZU /sign?token=... (wie in Ihrer alten Version)
    const qrUrl = `${origin}/sign?token=${encodeURIComponent(token)}`;

    res.status(200).json({ qrUrl, token, expiresAt });
  } catch (e) {
    console.error('signature/create final catch error', e);
    res.status(500).json({ error: 'Server error' });
  }
}