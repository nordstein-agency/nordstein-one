// /pages/api/signature/submit.js (VOLLSTÄNDIG KORRIGIERT)
import { supabase } from '../../../lib/supabaseClient';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// getFileLinkByPath wird nicht mehr für den Download, aber für Kompatibilität importiert
import { getFileLinkByPath, uploadFileBuffer, deleteFileByPath } from '../../../lib/pcloud'; 
import { sha256 } from '../../../lib/hash';

async function getAccessToken() {
  // hol den neuesten pCloud-Token aus deiner Tabelle
  const { data } = await supabase
    .from('pcloud_tokens')
    .select('access_token')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.access_token || process.env.PCLOUD_ACCESS_TOKEN;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {}; 
    const { token, signatureBase64, userAgent, screen, geo } = body;
    if (!token || !signatureBase64) return res.status(400).json({ error: 'Missing token or signature' });

    // 1) Session prüfen
    const { data: session, error: sessionError } = await supabase
      .from('signature_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    
    if (sessionError || !session) return res.status(404).json({ error: 'Session not found' });
    if (session.used) return res.status(400).json({ error: 'Token already used' });
    if (new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

    const accessToken = await getAccessToken();
    if (!accessToken) return res.status(500).json({ error: 'No pCloud token available' });

    const { role, customer_id, customer_name, document_name, folder_id } = session;


    console.log('DB-Suche gestartet für...');
    console.log('CustomerName (Session):', customer_name);
    console.log('DocumentName (Session):', document_name);

    // 2) PDF-Template aus der Contracts-Tabelle holen
    
    // ✅ FIX: Download-Link aus der Contracts-Tabelle holen
    const { data: contractData, error: contractError } = await supabase
        .from('contracts') // Hier muss der Name Ihrer Tabelle stehen, in der die PDF-URL gespeichert ist.
        .select('pdf_url')
        .eq('customer_name', customer_name) // Abgleich anhand des Kundennamens
        .eq('document_name', document_name) // Abgleich anhand des Dokumentennamens
        .maybeSingle();
    
    if (contractError || !contractData?.pdf_url) {
        console.error("Datenbankfehler oder fehlender PDF-Link in DB:", contractError);
        return res.status(404).json({ error: 'Original PDF download link not found in database.' });
    }
    
    const fileUrl = contractData.pdf_url; 
    console.log('🔗 Datenbank-Link verwendet für Download:', fileUrl);
    
    // Versuch, die Datei herunterzuladen (hier tritt der SocketError auf, 
    // muss nun wegen Gültigkeit des Links behoben sein)
    const fileResp = await fetch(fileUrl);
    
    if (!fileResp.ok) {
        // Dieser Fehler deutet darauf hin, dass der Link abgelaufen oder ungültig ist.
        console.error(`❌ Download failed, Link abgelaufen/ungültig: ${fileResp.status} ${fileResp.statusText}`);
        return res.status(500).json({ error: 'Failed to download PDF template (Link expired/invalid).' });
    }
    const templateBytes = new Uint8Array(await fileResp.arrayBuffer());

    // 3) PDF bearbeiten: Unterschrift + Zeitstempel + Gerätedaten
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0);
    
    const pngBytes = Buffer.from(signatureBase64.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(0.5);

    // Position der Signatur (einfache Position unten links)
    const x = 50, y = 120;
    page.drawImage(pngImage, { x, y, width: pngDims.width, height: pngDims.height });

    // Zeitstempel + Geräteinfos
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const ts = new Date();
    const UAParser = require('ua-parser-js'); // ✅ UAParser FIX beibehalten
    const parser = new UAParser(userAgent || '');
    const ua = parser.getResult();
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || '';

    const infoText = [
      `Signiert am: ${ts.toLocaleString('de-AT')}`,
      `Rolle: ${role}`,
      `Gerät: ${ua.device?.model || 'n/a'} | OS: ${ua.os?.name || 'n/a'} ${ua.os?.version || ''} | Browser: ${ua.browser?.name || 'n/a'} ${ua.browser?.version || ''}`,
      `IP: ${ip}`,
      geo?.coords ? `Geo: ${geo.coords.latitude.toFixed(5)}, ${geo.coords.longitude.toFixed(5)}` : null
    ].filter(Boolean).join('  •  ');

    page.drawText(infoText, { x: 50, y: 90, size: 9, color: rgb(0.2, 0.2, 0.2), font });

    const finalBytes = await pdfDoc.save();
    const finalHash = await sha256(finalBytes);

    // 4) finalen Namen bestimmen
    const signedSuffix = role === 'customer' ? '_signed_customer' : '_signed_executive';
    const signedName =
      document_name.toLowerCase().endsWith('.pdf')
        ? document_name.replace(/\.pdf$/i, `${signedSuffix}.pdf`)
        : `${document_name}${signedSuffix}.pdf`;

    // 5) Alte Datei optional löschen (Template)
    // const safePath = `/${encodeURIComponent(customer_name)}/${document_name}`;
    // await deleteFileByPath({ path: safePath, accessToken });

    // ✅ FIX: folder_id auf Gültigkeit prüfen und in Zahl konvertieren
    const folderIdForPcloud = folder_id ? Number(folder_id) : null; 

    if (!folderIdForPcloud || isNaN(folderIdForPcloud)) {
        console.error("Missing or invalid folderId for pCloud upload:", folder_id);
        return res.status(400).json({ error: 'Missing or invalid pCloud folder ID for upload.' });
    }

    // 6) Neue Datei hochladen
    const uploaded = await uploadFileBuffer({
      folderId: folderIdForPcloud, // ✅ FIX: Numerische ID verwenden
      filename: signedName,
      buffer: Buffer.from(finalBytes),
      accessToken
    });

    const fileId = uploaded?.fileid ? Number(uploaded.fileid) : null;

    // 7) Signatur in passender Tabelle speichern
    const device_info = {
      userAgent,
      uaParsed: ua,
      screen,
      ip,
      geo
    };

    const table = role === 'customer' ? 'customer_signatures' : 'executive_signatures';
    const { error: sigErr } = await supabase.from(table).insert({
      customer_id,
      document_name: signedName,
      pcloud_file_id: fileId,
      hash: finalHash,
      device_info,
      signed_at: new Date().toISOString()
    });
    
    if (sigErr) {
        console.error("Supabase insert signature failed:", sigErr);
        return res.status(500).json({ error: 'DB insert signature failed' });
    }

    // 8) Session als used markieren
    await supabase.from('signature_sessions').update({ used: true }).eq('token', token);

    res.status(200).json({ ok: true, signedName, fileId, hash: finalHash });
  } catch (e) {
    console.error('signature/submit error (FATAL CATCH)', e);
    res.status(500).json({ error: 'Server error' });
  }
}