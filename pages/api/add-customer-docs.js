// pages/api/add-customer-docs.js
import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req, res) {
  console.log("📩 Neue Anfrage erhalten:", req.method, req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 🆕 newFileName optional für benutzerdefinierten Uploadnamen
    const { customerName, files, newFileName } = req.body;
    console.log("📄 Neuer Dateiname laut Frontend:", newFileName);

    if (!customerName || !files || files.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const safeName = customerName.trim();
    console.log(`🔍 Suche nach pCloud-Ordner: ${safeName}`);

    // 🔹 Kundenordner im "customers"-Root suchen
    const listUrl = `${process.env.PCLOUD_API_URL}/listfolder?folderid=${process.env.PCLOUD_CUSTOMERS_FOLDER_ID}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`;
    const listResp = await fetch(listUrl);
    const listData = await listResp.json();

    if (listData.result !== 0) {
      throw new Error(`Fehler beim Lesen des customers-Ordners: ${listData.error}`);
    }

    const folder = listData.metadata.contents.find(
      (item) => item.name === safeName && item.isfolder
    );

    if (!folder) {
      console.error(`❌ Kein pCloud-Ordner für ${safeName} gefunden`);
      return res.status(404).json({ message: `Kein pCloud-Ordner für ${safeName} gefunden` });
    }

    const customerFolderId = folder.folderid;
    console.log(`📁 Kundenordner gefunden: ${safeName} (${customerFolderId})`);

    // 🔽 Dateien laden & hochladen
    const uploadedFiles = [];
    const fileIds = [];
    let lastFolderId = null; // 🧠 wir speichern hier die letzte Folder-ID

    for (const fileName of files) {
      const templateUrl = `https://qtniwqhmnfgftaqioinb.supabase.co/storage/v1/object/public/concept_templates/contract_templates/${fileName}.pdf`;
      console.log(`⬆️ Lade Datei: ${templateUrl}`);

      const response = await fetch(templateUrl);
      if (!response.ok) throw new Error(`Fehler beim Laden der Datei ${fileName}`);

      const buffer = Buffer.from(await response.arrayBuffer());

      // 🧩 Dateiname bestimmen — verwende newFileName falls mitgegeben
      const isMultiple = files.length > 1;
      const finalFileName = newFileName
        ? isMultiple
          ? `${newFileName.replace(".pdf", "")}_${fileName}.pdf`
          : newFileName
        : `${fileName}.pdf`;

      console.log(`📄 Verwende finalen Dateinamen: ${finalFileName}`);

      // 🔼 Datei per FormData an pCloud senden
      const form = new FormData();
      form.append("filename", finalFileName);
      form.append("file", buffer, finalFileName);

      const uploadUrl = `${process.env.PCLOUD_API_URL}/uploadfile?folderid=${customerFolderId}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`;
      console.log(`📤 Lade hoch als: ${finalFileName}`);

      const uploadResp = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      const uploadData = await uploadResp.json();

      if (uploadData.result !== 0) {
        console.error("❌ Upload-Fehler:", JSON.stringify(uploadData, null, 2));
        throw new Error(`pCloud-Fehler: ${uploadData.result} - ${uploadData.error}`);
      }

      // 📦 Erfolg — Daten speichern
      uploadedFiles.push(finalFileName.replace(".pdf", ""));
      fileIds.push(uploadData.metadata?.[0]?.fileid);
      lastFolderId = uploadData.metadata?.[0]?.folderid || customerFolderId; // 📁 Folder-ID sichern

      console.log(
        `✅ Erfolgreich hochgeladen: ${finalFileName} (ID: ${uploadData.metadata?.[0]?.fileid})`
      );
    }

    // ✅ Antwort mit allen nötigen Daten
    res.status(200).json({
      message: `Dokumente erfolgreich in ${safeName} hochgeladen.`,
      uploadedFiles,
      fileIds,
      folderId: lastFolderId, // ✅ Richtiger Ordner zurückgeben
    });
  } catch (error) {
    console.error("❌ Fehler beim Hochladen in pCloud:", error);
    res.status(500).json({
      message: "Fehler beim Hochladen in pCloud",
      error: error.message,
    });
  }
}
