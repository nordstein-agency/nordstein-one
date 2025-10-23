import fetch from "node-fetch";

export default async function handler(req, res) {
  // Stellen Sie sicher, dass Sie den richtigen Token verwenden
  const token = process.env.PCLOUD_ACCESS_TOKEN || process.env.NEXT_PUBLIC_PCLOUD_ACCESS_TOKEN;
  const apiUrl = process.env.NEXT_PUBLIC_PCLOUD_API_URL || "https://api.pcloud.com"; 

  if (!token) {
    return res.status(500).json({ error: "Access Token fehlt in der Umgebungsvariable." });
  }

  const checkUrl = `${apiUrl}/userinfo?access_token=${token}`;
  console.log(`➡️ Teste Token mit: ${checkUrl}`);

  try {
    const response = await fetch(checkUrl);
    const data = await response.json();

    if (data.result !== 0) {
      // Fehler, z.B. Invalid Token (result 2094)
      console.error("❌ pCloud userinfo Fehler:", data);
      return res.status(401).json({ 
        message: "Token ist ungültig oder abgelaufen.", 
        pCloudError: data
      });
    }

    // Erfolg: Berechtigungen ausgeben
    const permissions = data.permissions;
    
    // Die relevante Berechtigung ist 'publink'
    const hasPublinkPermission = permissions.includes('publink');
    
    return res.status(200).json({
      message: "Token ist gültig. Hier sind die Berechtigungen:",
      permissions: permissions,
      has_publink_permission: hasPublinkPermission
    });

  } catch (err) {
    console.error("❌ Fehler beim API-Aufruf:", err);
    return res.status(500).json({ error: err.message });
  }
}