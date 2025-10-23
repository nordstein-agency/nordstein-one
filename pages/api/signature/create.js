// /pages/api/signature/create.js
import { supabase } from '../../../lib/supabaseClient';
import { sha256 } from '../../../lib/hash'; // Angenommen, Sie benötigen sha256 hier nicht, aber ich lasse den Import, falls er existiert
import { createId } from '@paralleldrive/cuid2'; // Angenommen, Sie verwenden cuid2 für den Token

// Dauer, bis der Token abläuft (z.B. 30 Minuten)
const TOKEN_EXPIRY_MINUTES = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Daten aus dem Frontend-Body entnehmen
    const { 
        customerId, 
        customerName, 
        documentName, 
        role, 
        folderId, 
        signaturePosition // ✅ NEU: Die dynamische Position
    } = req.body; 

    if (!customerId || !documentName || !role || !folderId || !signaturePosition) {
        return res.status(400).json({ error: 'Missing required fields (customerId, documentName, role, folderId, signaturePosition).' });
    }

    // 2. Token generieren und Ablaufdatum festlegen
    const newToken = createId(); 
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + TOKEN_EXPIRY_MINUTES);

    // 3. Session in der Datenbank speichern
    const { data, error } = await supabase
        .from('signature_sessions')
        .insert([
            {
                token: newToken,
                customer_id: customerId,
                customer_name: customerName,
                document_name: documentName,
                role: role,
                folder_id: folderId,
                // ✅ KORREKTUR: Die Position wird in die neue JSONB-Spalte gespeichert
                signature_position: signaturePosition, 
                expires_at: expirationDate.toISOString(),
                used: false, // Standardmäßig auf 'false' setzen
            }
        ])
        .select()
        .single();
    
    if (error) {
        console.error('Database insertion failed in create.js:', error);
        return res.status(500).json({ error: 'Failed to create signature session.' });
    }

    // 4. Signatur-URL für den QR-Code erstellen
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`;
    const signatureUrl = `${baseUrl}/signature?token=${newToken}`;

    // 5. Erfolg zurückmelden
    res.status(200).json({ 
        ok: true, 
        token: newToken, 
        qrUrl: signatureUrl,
        expiresAt: expirationDate.toISOString()
    });

  } catch (e) {
    console.error('signature/create error (FATAL CATCH)', e);
    res.status(500).json({ error: 'Server error' });
  }
}