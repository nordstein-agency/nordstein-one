// pages/api/proxy-pdf.js
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fehler beim Laden der PDF von pCloud");

    // 🔹 PDF vollständig in Buffer laden
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔹 Header setzen und senden
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.send(buffer);
  } catch (err) {
    console.error("❌ Fehler im proxy-pdf:", err);
    res.status(500).json({ error: err.message });
  }
}
