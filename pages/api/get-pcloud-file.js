// pages/api/get-pcloud-file.js
export default async function handler(req, res) {
  const { customerName, documentName } = req.query;

  if (!customerName || !documentName) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const cleanDocName = documentName.replace(/\.pdf$/i, "");
    const apiUrl = `${process.env.PCLOUD_API_URL}/getfilelink?path=/customers/${encodeURIComponent(
      customerName
    )}/${encodeURIComponent(cleanDocName)}.pdf&access_token=${
      process.env.PCLOUD_ACCESS_TOKEN
    }`;

    console.log("🔗 pCloud-API-URL:", apiUrl);

    const resp = await fetch(apiUrl);
    const data = await resp.json();

    console.log("📡 pCloud-Response:", data);

    if (data.result !== 0 || !data.path || !data.hosts?.length) {
      return res.status(500).json({
        error: data.error || "pCloud API Error",
        debug: data,
      });
    }

    // 🚀 Hier liegt der entscheidende Unterschied:
    // Wir erzwingen den öffentlichen CDN-Link mit "https://<host><path>"
    const host = data.hosts[0].startsWith('c') 
      ? data.hosts[0] 
      : `c${data.hosts[0]}`; // fallback

    const fullUrl = `https://${host}${data.path}`;

    console.log("✅ Finaler, stabiler CDN-Link:", fullUrl);

    res.status(200).json({ url: fullUrl });
  } catch (err) {
    console.error("❌ Serverfehler bei pCloud getfilelink:", err);
    res.status(500).json({ error: err.message });
  }
}
