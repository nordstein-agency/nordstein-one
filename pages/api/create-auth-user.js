// pages/api/create-auth-user.js
import { supabaseAdmin } from '../../lib/supabaseAdminClient'; // SERVICE_ROLE_KEY
import { supabase } from '../../lib/supabaseClient'; // ANON client für resetPasswordForEmail
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true für 465, false für 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function generateSupabasePassword() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";
  const password =
    letters[Math.floor(Math.random() * 26)] + // Großbuchstabe
    letters[Math.floor(Math.random() * 52)].toLowerCase() + // Kleinbuchstabe
    numbers[Math.floor(Math.random() * 10)] +
    symbols[Math.floor(Math.random() * symbols.length)] +
    Array.from({ length: 4 }, () =>
      letters[Math.floor(Math.random() * 52)]
    ).join("");
  return password;
}



export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    // 1️⃣ Auth-User erstellen
    const { data: userData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generateSupabasePassword(),
      email_confirm: true
    });
    if (error) throw error;


    /*
    // 2️⃣ Reset-Link generieren
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.RESET_REDIRECT_URL // wo User das Passwort setzen soll
    });
    */

    
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',      
    email,
    options: { redirectTo: process.env.RESET_REDIRECT_URL }
    });

    if (resetError) throw resetError;

   

    //const resetLink = resetData.action_link || resetData.properties?.action_link;

    const resetLink = resetData?.properties?.action_link;


    if (!resetLink) throw new Error("Reset-Link konnte nicht erstellt werden");
    
    

    //const resetLink = resetData?.action_link; // Link vom Supabase-Call

    


    // 3️⃣ Eigene Mail versenden
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Willkommen bei Nordstein Agency – Passwort setzen',
      html: `
        <p>Hallo!</p>
        <p>Dein Account wurde angelegt. Bitte setze dein Passwort über den folgenden Link:</p>
        <p><a href="${resetLink}" style="padding:10px 20px;background:#451a3d;color:white;text-decoration:none;">Passwort setzen</a></p>
        <p>Viele Grüße,<br/>Nordstein Agency</p>
      `
    });

    console.log("resetLink:", resetLink);
console.log("Email versendet an:", email);


    res.status(200).json({ userId: userData.user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
