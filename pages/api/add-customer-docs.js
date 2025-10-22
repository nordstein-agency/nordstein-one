// pages/api/add-customer-docs.js
import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req, res) {
  console.log("📩 Neue Anfrage erhalten:", req.method, req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { customerName, files } = req.body;
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

    for (const fileName of files) {
      const fileUrl = `https://qtniwqhmnfgftaqioinb.supabase.co/storage/v1/object/public/concept_templates/contract_templates/${fileName}.pdf`;
      console.log(`⬆️ Lade Datei: ${fileUrl}`);

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Fehler beim Laden der Datei ${fileName}`);

      const buffer = Buffer.from(await response.arrayBuffer());

      // 🔼 Datei per FormData an pCloud senden
      const form = new FormData();
      form.append("filename", buffer, `${fileName}.pdf`);

      const uploadUrl = `${process.env.PCLOUD_API_URL}/uploadfile?folderid=${customerFolderId}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`;
      const uploadResp = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      const uploadData = await uploadResp.json();

      if (uploadData.result !== 0) {
        console.error("❌ Upload-Fehler:", uploadData);
        throw new Error(uploadData.error);
      }

      uploadedFiles.push(fileName);
      console.log(`✅ Erfolgreich hochgeladen: ${fileName}.pdf`);
    }

    res.status(200).json({
      message: `Dokumente erfolgreich in ${safeName} hochgeladen.`,
      uploadedFiles,
    });
  } catch (error) {
    console.error("❌ Fehler beim Hochladen in pCloud:", error);
    res.status(500).json({
      message: "Fehler beim Hochladen in pCloud",
      error: error.message,
    });
  }
}
