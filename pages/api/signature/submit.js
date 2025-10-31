
/*

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
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { token, signatureBase64, userAgent, screen, geo } = body;
    if (!token || !signatureBase64)
      return res.status(400).json({ error: 'Missing token or signature' });

    // 1) Session prüfen
    const { data: session, error: sessionError } = await supabase
      .from('signature_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (sessionError || !session)
      return res.status(404).json({ error: 'Session not found' });
    if (session.used)
      return res.status(400).json({ error: 'Token already used' });
    if (new Date(session.expires_at) < new Date())
      return res.status(400).json({ error: 'Token expired' });

    const accessToken = await getAccessToken();
    if (!accessToken)
      return res.status(500).json({ error: 'No pCloud token available' });

    const PCLOUD_API_URL =
      process.env.PCLOUD_API_URL || 'https://api.pcloud.com';
    if (!PCLOUD_API_URL)
      return res.status(500).json({ error: 'PCLOUD_API_URL not set' });

    const {
      role,
      customer_id,
      customer_name,
      document_name,
      folder_id,
      signature_position,
    } = session;

    // 🛑 DEBUGGING
    console.log('DB-Suche gestartet für...');
    console.log('Customer ID (Session):', customer_id);
    console.log('DocumentName (Session):', document_name);
    console.log('Signature Position (Session):', signature_position);
    console.log('🧾 --- SESSION DATEN ---');
    console.log('Customer:', customer_name);
    console.log('Document:', document_name);
    console.log('Folder ID (Session):', folder_id);
    console.log('-----------------------');

    const cleanDocName = document_name
      .replace(/^\/customers\/[^/]+\//, '')
      .replace(/^\//, '');

    // 2) PDF-Template aus der Contracts-Tabelle holen
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('pdf_url')
      .eq('customer_id', customer_id)
      .eq('document_name', cleanDocName)
      .maybeSingle();

    if (contractError) {
      console.error('Datenbankfehler bei Suche:', contractError);
      return res
        .status(500)
        .json({ error: 'Database query failed for PDF link.' });
    }

    console.log('Gefundene Vertragsdaten:', contractData.pdf_url);
    if (!contractData?.pdf_url) {
      console.error(
        `Link fehlt für customer_id: ${customer_id} und document: ${document_name}`
      );
      return res
        .status(404)
        .json({ error: 'Original PDF download link not found in database.' });
    }

    let fileUrl = contractData.pdf_url;
    console.log('🔗 Datenbank-Link verwendet für Download:', fileUrl);

    // Wenn nur ein Pfad (z. B. /customers/...) vorhanden ist → baue den vollständigen Download-Link
    if (fileUrl.startsWith('/customers/')) {
      const token = accessToken;
      const getFileUrl = `${PCLOUD_API_URL}/getfilelink?path=${encodeURIComponent(
        fileUrl
      )}&access_token=${token}`;
      console.log('📡 Hole echten Download-Link von pCloud:', getFileUrl);

      const metaResp = await fetch(getFileUrl);
      const metaData = await metaResp.json();

      if (metaData.result !== 0) {
        console.error('❌ pCloud getfilelink fehlgeschlagen:', metaData);
        return res
          .status(500)
          .json({ error: 'Failed to resolve PDF download link', debug: metaData });
      }

      const host = metaData.hosts?.[0];
      fileUrl = `https://${host}${metaData.path}`;
      console.log('✅ Vollständiger Download-Link:', fileUrl);
    }

    // 🚀 Download-Link bereinigen
    const downloadHost = PCLOUD_API_URL.replace('https://', '');
    let finalDownloadUrl = fileUrl.replace('publnk.pcloud.com', downloadHost);
    finalDownloadUrl = finalDownloadUrl.replace(/&amp;/g, '&');
    console.log('🔗 FINALER Download-Link nach Host-Korrektur:', finalDownloadUrl);

    // Datei herunterladen
    const fileResp = await fetch(finalDownloadUrl);
    if (!fileResp.ok) {
      console.error(
        `❌ Download failed: ${fileResp.status} ${fileResp.statusText}`
      );
      return res
        .status(500)
        .json({ error: `Failed to download PDF (Status: ${fileResp.status}).` });
    }
    const templateBytes = new Uint8Array(await fileResp.arrayBuffer());

    // 3) PDF bearbeiten
    const pdfDoc = await PDFDocument.load(templateBytes);
    const rawPageNumber = signature_position?.page || 1;
    const pageIndex = Math.max(0, rawPageNumber - 1);
    const page =
      pageIndex >= pdfDoc.getPageCount()
        ? pdfDoc.getPage(0)
        : pdfDoc.getPage(pageIndex);

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pngBytes = Buffer.from(signatureBase64.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(0.5);

    const rawX = signature_position?.x || 50;
    const rawY = signature_position?.y || 120;
    const viewerHeight = 900;
    const x = (rawX / pageWidth) * pageWidth;
    const y = (rawY / viewerHeight) * pageHeight;

    page.drawImage(pngImage, {
      x,
      y: y - pngDims.height / 2,
      width: pngDims.width,
      height: pngDims.height,
    });

    console.log(
      `[FIXED POS] rawX=${rawX}, rawY=${rawY}, → x=${x.toFixed(
        2
      )}, y=${y.toFixed(2)}, pageHeight=${pageHeight}`
    );

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const ts = new Date();
    const parser = new UAParser(userAgent || '');
    const ua = parser.getResult();
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    const infoText = [
      `Signiert am: ${ts.toLocaleString('de-AT')}`,
      `Rolle: ${role}`,
      `Gerät: ${ua.device?.model || 'n/a'} | OS: ${ua.os?.name || 'n/a'} ${
        ua.os?.version || ''
      } | Browser: ${ua.browser?.name || 'n/a'} ${ua.browser?.version || ''}`,
      `IP: ${ip}`,
      geo?.coords
        ? `Geo: ${geo.coords.latitude.toFixed(5)}, ${geo.coords.longitude.toFixed(
            5
          )}`
        : null,
    ]
      .filter(Boolean)
      .join('  •  ');

    page.drawText(infoText, {
      x: x,
      y: y - 30,
      size: 9,
      color: rgb(0.2, 0.2, 0.2),
      font,
    });

    const finalBytes = await pdfDoc.save();
    const finalHash = await sha256(finalBytes);

    const signedName = document_name.endsWith('.pdf')
      ? document_name
      : `${document_name}.pdf`;
    console.log('📄 Überschreibe Originaldatei:', signedName);

    // 🧩 -------- NEUER BLOCK: folder_id automatisch ermitteln --------
    let folderIdForPcloud = folder_id ? Number(folder_id) : null;

    if (!folderIdForPcloud || isNaN(folderIdForPcloud)) {
      console.log('📭 folder_id fehlt – versuche, sie über pCloud zu ermitteln...');
      try {
        let pathForStat = fileUrl;
        if (fileUrl.startsWith('http')) {
          const match = fileUrl.match(/\/customers\/[^/]+\/[^/?#]+\.pdf/i);
          pathForStat = match ? match[0] : fileUrl;
          console.log('📂 Extrahierter Pfad für stat():', pathForStat);
        }

        const statUrl = `${PCLOUD_API_URL}/stat?path=${encodeURIComponent(
          pathForStat
        )}&access_token=${accessToken}`;
        console.log('🔗 Stat-Abfrage an pCloud (bereinigt):', statUrl);

        const statResp = await fetch(statUrl);
        const statData = await statResp.json();

        if (statData.result === 0 && statData.metadata?.parentfolderid) {
          folderIdForPcloud = statData.metadata.parentfolderid;
          console.log('✅ folder_id automatisch bestimmt:', folderIdForPcloud);
        } else {
          console.error('❌ Konnte folder_id nicht bestimmen:', statData);
          return res
            .status(400)
            .json({ error: 'Missing or invalid pCloud folder ID for upload.' });
        }
      } catch (err) {
        console.error('❌ Fehler beim Abrufen der folder_id:', err);
        return res
          .status(400)
          .json({ error: 'Could not resolve folder_id automatically.' });
      }
    }
    // 🧩 -------- ENDE NEUER BLOCK --------

    // Upload vorbereiten
    const form = new FormData();
    form.append('file', Buffer.from(finalBytes), signedName);

    const uploadUrl = `${PCLOUD_API_URL}/uploadfile?folderid=${folderIdForPcloud}&access_token=${accessToken}&renameifexists=0`;
    console.log('📤 Upload zur pCloud:', uploadUrl);

    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    });

    const uploaded = await uploadResp.json();
    if (!uploaded || uploaded.result !== 0) {
      console.error('❌ PCloud UPLOAD FAILED! Reason:', uploaded);
      return res
        .status(500)
        .json({ error: 'Failed to upload signed PDF to pCloud.' });
    }

    const fileId = uploaded.metadata?.[0]?.fileid
      ? Number(uploaded.metadata[0].fileid)
      : null;

    // Signatur speichern
    const device_info = { userAgent, uaParsed: ua, screen, ip, geo };
    const table =
      role === 'customer' ? 'customer_signatures' : 'executive_signatures';
    const { error: sigErr } = await supabase.from(table).insert({
      customer_id,
      document_name: signedName,
      pcloud_file_id: fileId,
      hash: finalHash,
      device_info,
      signed_at: new Date().toISOString(),
    });

    if (sigErr) {
      console.error('Supabase insert signature failed:', sigErr);
      return res.status(500).json({ error: 'DB insert signature failed' });
    }

    // Session als used markieren
    await supabase
      .from('signature_sessions')
      .update({ used: true })
      .eq('token', token);

    res.status(200).json({ ok: true, signedName, fileId, hash: finalHash });
  } catch (e) {
    console.error('signature/submit error (FATAL CATCH)', e);
    res.status(500).json({ error: 'Server error' });
  }
}


*/


// /pages/api/signature/submit.js (FINAL FIX MIT KORREKTEM STAT-PFAD)
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
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { token, signatureBase64, userAgent, screen, geo } = body;
    if (!token || !signatureBase64)
      return res.status(400).json({ error: 'Missing token or signature' });

    // 1) Session prüfen
    const { data: session, error: sessionError } = await supabase
      .from('signature_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (sessionError || !session)
      return res.status(404).json({ error: 'Session not found' });
    if (session.used)
      return res.status(400).json({ error: 'Token already used' });
    if (new Date(session.expires_at) < new Date())
      return res.status(400).json({ error: 'Token expired' });

    const accessToken = await getAccessToken();
    if (!accessToken)
      return res.status(500).json({ error: 'No pCloud token available' });

    const PCLOUD_API_URL =
      process.env.PCLOUD_API_URL || 'https://api.pcloud.com';
    if (!PCLOUD_API_URL)
      return res.status(500).json({ error: 'PCLOUD_API_URL not set' });

    const {
      role,
      customer_id,
      customer_name,
      document_name,
      folder_id,
      signature_position,
    } = session;

    // 🛑 DEBUGGING
    console.log('DB-Suche gestartet für...');
    console.log('Customer ID (Session):', customer_id);
    console.log('DocumentName (Session):', document_name);
    console.log('Signature Position (Session):', signature_position);
    console.log('🧾 --- SESSION DATEN ---');
    console.log('Customer:', customer_name);
    console.log('Document:', document_name);
    console.log('Folder ID (Session):', folder_id);
    console.log('-----------------------');

    const cleanDocName = document_name
      .replace(/^\/customers\/[^/]+\//, '')
      .replace(/^\//, '');

    // 2) PDF-Template aus der Contracts-Tabelle holen
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select('pdf_url')
      .eq('customer_id', customer_id)
      .eq('document_name', cleanDocName)
      .maybeSingle();

    if (contractError) {
      console.error('Datenbankfehler bei Suche:', contractError);
      return res
        .status(500)
        .json({ error: 'Database query failed for PDF link.' });
    }

    console.log('Gefundene Vertragsdaten:', contractData.pdf_url);
    if (!contractData?.pdf_url) {
      console.error(
        `Link fehlt für customer_id: ${customer_id} und document: ${document_name}`
      );
      return res
        .status(404)
        .json({ error: 'Original PDF download link not found in database.' });
    }

    let fileUrl = contractData.pdf_url;
    console.log('🔗 Datenbank-Link verwendet für Download:', fileUrl);

    // Wenn nur ein Pfad (z. B. /customers/...) vorhanden ist → baue den vollständigen Download-Link
    if (fileUrl.startsWith('/customers/')) {
      const token = accessToken;
      const getFileUrl = `${PCLOUD_API_URL}/getfilelink?path=${encodeURIComponent(
        fileUrl
      )}&access_token=${token}`;
      console.log('📡 Hole echten Download-Link von pCloud:', getFileUrl);

      const metaResp = await fetch(getFileUrl);
      const metaData = await metaResp.json();

      if (metaData.result !== 0) {
        console.error('❌ pCloud getfilelink fehlgeschlagen:', metaData);
        return res
          .status(500)
          .json({ error: 'Failed to resolve PDF download link', debug: metaData });
      }

      const host = metaData.hosts?.[0];
      fileUrl = `https://${host}${metaData.path}`;
      console.log('✅ Vollständiger Download-Link:', fileUrl);
    }

    // 🚀 Download-Link bereinigen
    const downloadHost = PCLOUD_API_URL.replace('https://', '');
    let finalDownloadUrl = fileUrl.replace('publnk.pcloud.com', downloadHost);
    finalDownloadUrl = finalDownloadUrl.replace(/&amp;/g, '&');
    console.log('🔗 FINALER Download-Link nach Host-Korrektur:', finalDownloadUrl);

    // Datei herunterladen
    const fileResp = await fetch(finalDownloadUrl);
    if (!fileResp.ok) {
      console.error(
        `❌ Download failed: ${fileResp.status} ${fileResp.statusText}`
      );
      return res
        .status(500)
        .json({ error: `Failed to download PDF (Status: ${fileResp.status}).` });
    }
    const templateBytes = new Uint8Array(await fileResp.arrayBuffer());

    // 3) PDF bearbeiten
    const pdfDoc = await PDFDocument.load(templateBytes);
    const rawPageNumber = signature_position?.page || 1;
    const pageIndex = Math.max(0, rawPageNumber - 1);
    const page =
      pageIndex >= pdfDoc.getPageCount()
        ? pdfDoc.getPage(0)
        : pdfDoc.getPage(pageIndex);

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pngBytes = Buffer.from(signatureBase64.split(',')[1], 'base64');
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const pngDims = pngImage.scale(0.5);

    const rawX = signature_position?.x || 50;
    const rawY = signature_position?.y || 120;
    const viewerHeight = 900;
    const x = (rawX / pageWidth) * pageWidth;
    const y = (rawY / viewerHeight) * pageHeight;

    page.drawImage(pngImage, {
      x,
      y: y - pngDims.height / 2,
      width: pngDims.width,
      height: pngDims.height,
    });

    console.log(
      `[FIXED POS] rawX=${rawX}, rawY=${rawY}, → x=${x.toFixed(
        2
      )}, y=${y.toFixed(2)}, pageHeight=${pageHeight}`
    );

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const ts = new Date();
    const parser = new UAParser(userAgent || '');
    const ua = parser.getResult();
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    const infoText = [
      `Signiert am: ${ts.toLocaleString('de-AT')}`,
      `Rolle: ${role}`,
      `Gerät: ${ua.device?.model || 'n/a'} | OS: ${ua.os?.name || 'n/a'} ${
        ua.os?.version || ''
      } | Browser: ${ua.browser?.name || 'n/a'} ${ua.browser?.version || ''}`,
      `IP: ${ip}`,
      geo?.coords
        ? `Geo: ${geo.coords.latitude.toFixed(5)}, ${geo.coords.longitude.toFixed(
            5
          )}`
        : null,
    ]
      .filter(Boolean)
      .join('  •  ');

    page.drawText(infoText, {
      x: x,
      y: y - 30,
      size: 9,
      color: rgb(0.2, 0.2, 0.2),
      font,
    });

    const finalBytes = await pdfDoc.save();
    const finalHash = await sha256(finalBytes);

    const signedName = document_name.endsWith('.pdf')
      ? document_name
      : `${document_name}.pdf`;
    console.log('📄 Überschreibe Originaldatei:', signedName);

    // 🧩 FIXED BLOCK: folder_id automatisch aus pdf_url (nicht Download-Link)
    let folderIdForPcloud = folder_id ? Number(folder_id) : null;

    if (!folderIdForPcloud || isNaN(folderIdForPcloud)) {
      console.log('📭 folder_id fehlt – versuche, sie über pCloud zu ermitteln...');

      try {
        const filePathForStat = contractData.pdf_url.startsWith('/')
          ? contractData.pdf_url
          : `/${contractData.pdf_url}`;

        console.log("📂 Verwende diesen Pfad für stat():", filePathForStat);

        const statUrl = `${PCLOUD_API_URL}/stat?path=${encodeURIComponent(filePathForStat)}&access_token=${accessToken}`;
        console.log("🔗 Stat-Abfrage an pCloud (bereinigt):", statUrl);

        const statResp = await fetch(statUrl);
        const statData = await statResp.json();

        if (statData.result === 0 && statData.metadata?.parentfolderid) {
          folderIdForPcloud = statData.metadata.parentfolderid;
          console.log("✅ folder_id automatisch bestimmt:", folderIdForPcloud);
        } else {
          console.error("❌ Konnte folder_id nicht bestimmen:", statData);
          return res.status(400).json({ error: 'Missing or invalid pCloud folder ID for upload.' });
        }
      } catch (err) {
        console.error("❌ Fehler beim Abrufen der folder_id:", err);
        return res.status(400).json({ error: 'Could not resolve folder_id automatically.' });
      }
    }

    // Upload vorbereiten
    const form = new FormData();
    form.append('file', Buffer.from(finalBytes), signedName);

    const uploadUrl = `${PCLOUD_API_URL}/uploadfile?folderid=${folderIdForPcloud}&access_token=${accessToken}&renameifexists=0`;
    console.log('📤 Upload zur pCloud:', uploadUrl);

    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    });

    const uploaded = await uploadResp.json();
    if (!uploaded || uploaded.result !== 0) {
      console.error('❌ PCloud UPLOAD FAILED! Reason:', uploaded);
      return res
        .status(500)
        .json({ error: 'Failed to upload signed PDF to pCloud.' });
    }

    const fileId = uploaded.metadata?.[0]?.fileid
      ? Number(uploaded.metadata[0].fileid)
      : null;

    // Signatur speichern
    const device_info = { userAgent, uaParsed: ua, screen, ip, geo };
    const table =
      role === 'customer' ? 'customer_signatures' : 'executive_signatures';
    const { error: sigErr } = await supabase.from(table).insert({
      customer_id,
      document_name: signedName,
      pcloud_file_id: fileId,
      hash: finalHash,
      device_info,
      signed_at: new Date().toISOString(),
    });

    if (sigErr) {
      console.error('Supabase insert signature failed:', sigErr);
      return res.status(500).json({ error: 'DB insert signature failed' });
    }

    // Session als used markieren
    await supabase
      .from('signature_sessions')
      .update({ used: true })
      .eq('token', token);

    res.status(200).json({ ok: true, signedName, fileId, hash: finalHash });
  } catch (e) {
    console.error('signature/submit error (FATAL CATCH)', e);
    res.status(500).json({ error: 'Server error' });
  }
}
