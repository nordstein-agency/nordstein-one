import { google } from "googleapis";

export default async function handler(req, res) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  console.log("✅ Refresh Token:", tokens.refresh_token);

  res.send("Erfolgreich! Kopiere dein Refresh Token aus dem Server-Log.");
}
