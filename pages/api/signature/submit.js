// pages/api/signature/submit.js
import { supabase } from '../../../lib/supabaseClient';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getFileLinkByPath, uploadFileBuffer, deleteFileByPath } from '../../../lib/pcloud';
import { sha256 } from '../../../lib/hash';
import UAParser from 'ua-parser-js';

async function getAccessToken() {
  // hol den neuesten pCloud-Token aus deiner Tabelle (du hast das schon genutzt)
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
    const body = JSON.parse(req.body || '{}');
    const { token, signatureBase64, userAgent, screen, geo } = body;
    if (!token || !signatureBase64) return res.status(400).json({ error: 'Missing token or signature' });

    // 1) Session prüfen
    const { data: session, error } = await supabase
      .from('signature_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (error || !session) return res.status(404).json({ error: 'Session not found' });
    if (session.used) return res.status(400).json({ error: 'Token already used' });
    if (new Date(session.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

    const accessToken = await getAccessToken();
    if (!accessToken) return res.status(500).json({ error: 'No pCloud token available' });

    const { role, customer_id, customer_name, document_name, folder_id } = {
      role: session.role,
      customer_id: session.customer_id,
      customer_name: session.customer_name,
      document_name: session.document_name,
      folder_id: session.folder_id
    };

    // 2) PDF-Template aus pCloud holen (Pfad: /customers/<Name>/<DocName>)
    const path = `/customers/${customer_name}/${document_name}`;
    const fileUrl = await getFileLinkByPath({ path, accessToken });
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) return res.status(400).json({ error: 'Download failed' });
    const templateBytes = new Uint8Array(await fileResp.arrayBuffer());

    // 3) PDF bearbeiten: Unterschrift + Zeitstempel + Gerätedaten
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0); // simpel: erste Seite; später: Koordinaten pro Dokument
    const pngBytes = Buffer.from(signatureBase64.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(0.5);

    // einfache Position unten links; später: feste Felder/Koordinaten je Template
    const x = 50, y = 120;
    page.drawImage(pngImage, { x, y, width: pngDims.width, height: pngDims.height });

    // Zeitstempel + Geräteinfos
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const ts = new Date();
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

    // 4) finalen Namen bestimmen (z.B. *_signed_customer.pdf oder *_signed_executive.pdf)
    const signedSuffix = role === 'customer' ? '_signed_customer' : '_signed_executive';
    const signedName =
      document_name.toLowerCase().endsWith('.pdf')
        ? document_name.replace(/\.pdf$/i, `${signedSuffix}.pdf`)
        : `${document_name}${signedSuffix}.pdf`;

    // 5) Alte Datei optional löschen (Template) – NUR wenn du das wirklich willst:
    // await deleteFileByPath({ path, accessToken });

    // 6) Neue Datei hochladen (selber Ordner)
    const uploaded = await uploadFileBuffer({
      folderId: folder_id,
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
      file_hash: finalHash,
      device_info
    });
    if (sigErr) return res.status(500).json({ error: 'DB insert signature failed' });

    // 8) Session als used markieren
    await supabase.from('signature_sessions').update({ used: true }).eq('token', token);

    res.status(200).json({ ok: true, signedName, fileId, hash: finalHash });
  } catch (e) {
    console.error('signature/submit error', e);
    res.status(500).json({ error: 'Server error' });
  }
}
