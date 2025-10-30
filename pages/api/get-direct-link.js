// pages/api/get-direct-link.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { path } = req.query;
    // path erwartet z.B. "/customers/EFS-AG/Dienstleistungsvertrag.pdf"

    if (!path) {
      return res.status(400).json({ error: "Missing 'path'" });
    }

    const apiUrl = process.env.PCLOUD_API_URL || "https://api.pcloud.com";
    const token =
      process.env.PCLOUD_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Missing pCloud token" });
    }

    // 1) Frag pCloud nach direktem Download-Link für genau diese Datei
    //    getfilelink gibt dir { hosts: [...], path: "/some/hash/filename.pdf", result: 0 }
    const url = `${apiUrl}/getfilelink?path=${encodeURIComponent(
      path
    )}&access_token=${token}`;

    const resp = await fetch(url, { method: "GET" });
    const data = await resp.json();

    console.log("pCloud getfilelink response:", data);

    if (!resp.ok || data.result !== 0) {
      return res.status(500).json({
        error: data.error || "pCloud getfilelink failed",
        debug: data,
      });
    }

    // pCloud liefert so etwas:
    // {
    //   "hosts": ["u12345678.pcloud.com"],
    //   "path": "/ZGxvbmdfd3V0X2VpbmUv.../Dienstleistungsvertrag.pdf",
    //   "result": 0
    // }
    const host = data.hosts?.[0];
    const filePath = data.path;

    if (!host || !filePath) {
      return res.status(500).json({ error: "Invalid getfilelink data" });
    }

    // Baue finalen Direktlink. Das ist ein ganz normaler HTTPS-Link zur Datei.
    const directUrl = `https://${host}${filePath}`;

    // diesen Link geben wir ans Frontend zurück und speichern ihn in Supabase
    return res.status(200).json({
      ok: true,
      directUrl,
    });
  } catch (err) {
    console.error("get-direct-link error:", err);
    return res.status(500).json({ error: err.message });
  }
}
