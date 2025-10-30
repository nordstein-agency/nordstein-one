// /pages/api/proxy-pdf.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    console.log("🔗 Starte Proxy-Download von:", url);

    // ⚠️ Timeout verhindern (Standard-Node-Fetch hat keinen Timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // 🔹 Manche pCloud-Links brauchen 'no-cors' / user-agent, daher:
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Next.js Server)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("📡 Response Status:", response.status);
    console.log("📡 Response Headers:", Object.fromEntries(response.headers));

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Response Body:", text.slice(0, 500));
      return res
        .status(response.status)
        .json({ error: "Failed to fetch PDF from pCloud", status: response.status });
    }

    // 🔸 Stream direkt an den Client weiter
    res.setHeader("Content-Type", "application/pdf");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("❌ Proxy-Fehler (fetch failed):", err);
    res.status(500).json({
      error: "fetch failed",
      message: err.message,
      stack: err.stack,
    });
  }
}
