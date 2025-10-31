// /pages/api/signature/submit.js (FINAL KORRIGIERTE VERSION)
import { supabase } from '../../../lib/supabaseClient';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { sha256 } from '../../../lib/hash';

import fetch from "node-fetch";
import FormData from "form-data"; 
const UAParser = require('ua-parser-js'); 

async function getAccessToken() {
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
    
    const PCLOUD_API_URL = process.env.PCLOUD_API_URL || "https://api.pcloud.com";
    if (!PCLOUD_API_URL) return res.status(500).json({ error: 'PCLOUD_API_URL not set' });


    const { role, customer_id, customer_name, document_name, folder_id, signature_position } = session; 
    
    // 🛑 DEBUGGING-ZEILEN
    console.log('DB-Suche gestartet für...');
    console.log('Customer ID (Session):', customer_id);
    console.log('DocumentName (Session):', document_name); 
    console.log('Signature Position (Session):', signature_position); 

    // 2) PDF-Template aus der Contracts-Tabelle holen
    const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('pdf_url')
        .eq('customer_id', customer_id) 
        .eq('document_name', document_name)
        .maybeSingle();
    
    if (contractError) {
        console.error("Datenbankfehler bei Suche:", contractError);
        return res.status(500).json({ error: 'Database query failed for PDF link.' });
    }
    
    if (!contractData?.pdf_url) {
        console.error(`Link fehlt für customer_id: ${customer_id} und document: ${document_name}`);
        return res.status(404).json({ error: 'Original PDF download link not found in database.' });
    }
    
    let fileUrl = contractData.pdf_url; 
    console.log('🔗 Datenbank-Link verwendet für Download:', fileUrl);

    // Wenn nur ein Pfad (z. B. /customers/...) vorhanden ist → baue den vollständigen Download-Link
if (fileUrl.startsWith('/customers/')) {
  const token = accessToken; // aus deiner Funktion getAccessToken()
  const getFileUrl = `${PCLOUD_API_URL}/getfilelink?path=${encodeURIComponent(fileUrl)}&access_token=${token}`;
  console.log('📡 Hole echten Download-Link von pCloud:', getFileUrl);

  const metaResp = await fetch(getFileUrl);
  const metaData = await metaResp.json();

  if (metaData.result !== 0) {
    console.error('❌ pCloud getfilelink fehlgeschlagen:', metaData);
    return res.status(500).json({ error: 'Failed to resolve PDF download link', debug: metaData });
  }

  const host = metaData.hosts?.[0];
  fileUrl = `https://${host}${metaData.path}`;
  console.log('✅ Vollständiger Download-Link:', fileUrl);
}

    
    // 🚀 FIX: Erzwinge die Nutzung des stabilen API-Hosts und bereinige '&amp;'
    // Dies behebt den ENOTFOUND-Fehler und funktioniert nun, da der Link linkid, code & token enthält.
    const downloadHost = PCLOUD_API_URL.replace('https://', '');
    let finalDownloadUrl = fileUrl.replace('publnk.pcloud.com', downloadHost); 
    finalDownloadUrl = finalDownloadUrl.replace(/&amp;/g, '&'); 
    
    console.log('🔗 FINALER Download-Link nach Host-Korrektur:', finalDownloadUrl);
    
    // Versuch, die Datei herunterzuladen
    const fileResp = await fetch(finalDownloadUrl);

    if (!fileResp.ok) {
        console.error(`❌ Download failed, Link abgelaufen/ungültig: ${fileResp.status} ${fileResp.statusText}`);
        return res.status(500).json({ error: `Failed to download PDF template (Status: ${fileResp.status}).` });
    }
    const templateBytes = new Uint8Array(await fileResp.arrayBuffer());

    // 3) PDF bearbeiten: Unterschrift + Zeitstempel + Gerätedaten
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const rawPageNumber = signature_position?.page || 1; 
    const pageIndex = Math.max(0, rawPageNumber - 1); 
    
    let page;
    if (pageIndex >= pdfDoc.getPageCount()) {
        console.warn(`Seitenzahl ${rawPageNumber} ist ungültig. Verwende Seite 1.`);
        page = pdfDoc.getPage(0);
    } else {
        page = pdfDoc.getPage(pageIndex);
    }
    
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const viewerPixelHeight = 900; 

    const pngBytes = Buffer.from(signatureBase64.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(0.5);

    // ✅ NEUE SKALIERUNG
    const rawX = signature_position?.x || 50;
    const rawY = signature_position?.y || 120;

    const viewerHeight = 900; 
    
    // X-Skalierung
    const x = (rawX / pageWidth) * pageWidth; 
    
    // Y-Skalierung
    const y = (rawY / viewerHeight) * pageHeight;

    // Zeichnen an der korrigierten Y-Position (mit leichter Zentrierung)
    page.drawImage(pngImage, {
      x,
      y: y - pngDims.height / 2, 
      width: pngDims.width,
      height: pngDims.height,
    });

    console.log(
      `[FIXED POS] rawX=${rawX}, rawY=${rawY}, → x=${x.toFixed(2)}, y=${y.toFixed(2)}, pageHeight=${pageHeight}`
    );


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
    
    // Zeitstempel unter der Signatur (dynamische Y-Koordinate)
    const infoTextY = y - 30; // 30 Punkte unter dem Ankerpunkt der Signatur
    page.drawText(infoText, { x: x, y: infoTextY, size: 9, color: rgb(0.2, 0.2, 0.2), font });


    const finalBytes = await pdfDoc.save();
    const finalHash = await sha256(finalBytes);

    // 4) finalen Namen bestimmen
    const signedSuffix = role === 'customer' ? '_signed_customer' : '_signed_executive';
    const signedName =
      document_name.toLowerCase().endsWith('.pdf')
        ? document_name.replace(/\.pdf$/i, `${signedSuffix}.pdf`)
        : `${document_name}${signedSuffix}.pdf`;

    // 6) Neue Datei hochladen (KORRIGIERT MIT FORM-DATA)
    const folderIdForPcloud = folder_id ? Number(folder_id) : null; 

    if (!folderIdForPcloud || isNaN(folderIdForPcloud)) {
        console.error("Missing or invalid folderId for pCloud upload:", folder_id);
        return res.status(400).json({ error: 'Missing or invalid pCloud folder ID for upload.' });
    }
    
    const form = new FormData();
    form.append("file", Buffer.from(finalBytes), signedName); 

    const uploadUrl = `${PCLOUD_API_URL}/uploadfile?folderid=${folderIdForPcloud}&access_token=${accessToken}`;
    
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      body: form,
    });

    const uploaded = await uploadResp.json();
    
    // 🛑 EXAKTE FEHLERPRÜFUNG:
    if (!uploaded || uploaded.result !== 0) {
        console.error('❌ PCloud UPLOAD FAILED! Reason:', uploaded); 
        console.error('File was NOT saved:', signedName);
        return res.status(500).json({ error: 'Failed to upload signed PDF to pCloud.' });
    }

    const fileId = uploaded.metadata?.[0]?.fileid ? Number(uploaded.metadata[0].fileid) : null; 

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