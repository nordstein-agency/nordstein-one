import nodemailer from 'nodemailer'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { contractId } = req.body

  try {
    // 1️⃣ Vertrag aus Supabase abrufen
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('id, customer_id, pdf_url')
      .eq('id', contractId)
      .single()
    if (error || !contract) throw new Error('Vertrag nicht gefunden')

    // 2️⃣ Kunde abrufen
    const { data: customer } = await supabase
      .from('customers')
      .select('name')
      .eq('id', contract.customer_id)
      .single()

    // 3️⃣ PDF aus Supabase Storage herunterladen
    const { data: pdfData, error: pdfError } = await supabase
      .storage
      .from('contracts')
      .download(contract.pdf_url)
    if (pdfError) throw pdfError

    const arrayBuffer = await pdfData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4️⃣ SMTP-Transport erstellen
    const transporter = nodemailer.createTransport({
      host: 'mail.nordstein-agency.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: 'vertrag@nordstein-agency.com',
        pass: '8]HYGn*PByrB'
      }
    })

    // 5️⃣ Mail vorbereiten
    const mailOptions = {
      from: '"Nordstein Agency" <vertrag@nordstein-agency.com>',
      to: 'vertrag@nordstein-agency.com',
      subject: `Vertrag Kunde ${customer.name}`,
      text: `Der Vertrag für ${customer.name} ist angehängt.`,
      attachments: [
        {
          filename: `${customer.name}_vertrag.pdf`,
          content: buffer
        }
      ]
    }

    // 6️⃣ Mail senden
    await transporter.sendMail(mailOptions)


    // --- setze sent_at in der contracts-Tabelle ---
const now = new Date().toISOString()
const { error: updateError } = await supabase
  .from('contracts')
  .update({ sent_at: now })
  .eq('id', contractId)

if (updateError) {
  console.error('Fehler beim Setzen von sent_at:', updateError)
  throw updateError
}



    res.status(200).json({ message: 'Email erfolgreich versendet' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
