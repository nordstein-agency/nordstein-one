
/*

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { format } from "date-fns"

export const config = { api: { bodyParser: true } }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { customerName, customerAddress, customerCountry, items } = req.body
    const date = format(new Date(), "dd.MM.yyyy")

    const offerNumber = `ANG-${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let y = height - 80

    // 🔹 LOGO
    try {
      const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/logo.png`
      const logoRes = await fetch(logoUrl)
      if (logoRes.ok) {
        const logoBytes = await logoRes.arrayBuffer()
        const logoImage = await pdfDoc.embedPng(logoBytes)
        const logoDims = logoImage.scale(0.15)
        page.drawImage(logoImage, {
          x: 50,
          y: height - 110,
          width: logoDims.width,
          height: logoDims.height,
        })
      } else {
        page.drawText("NORDSTEIN ONE", { x: 50, y, size: 20, font, color: rgb(0.27, 0.1, 0.24) })
      }
    } catch {
      page.drawText("NORDSTEIN ONE", { x: 50, y, size: 20, font, color: rgb(0.27, 0.1, 0.24) })
    }

    y -= 40
    page.drawText(`Angebot Nr.: ${offerNumber}`, { x: 50, y, size: 14, font })
    y -= 40
    page.drawText(`Kunde: ${customerName}`, { x: 50, y, size: 12, font })
    y -= 15
    if (customerAddress) {
      page.drawText(`Adresse: ${customerAddress}`, { x: 50, y, size: 11, font })
      y -= 15
    }
    if (customerCountry) {
      page.drawText(`Land: ${customerCountry}`, { x: 50, y, size: 11, font })
      y -= 15
    }
    y -= 10
    page.drawText(`Datum: ${date}`, { x: 50, y, size: 12, font })
    y -= 40

    // TABELLENKOPF
    page.drawText("Pos.", { x: 50, y, size: 12, font })
    page.drawText("Bezeichnung", { x: 100, y, size: 12, font })
    page.drawText("Preis (€)", { x: 450, y, size: 12, font })
    y -= 10
    page.drawLine({ start: { x: 50, y }, end: { x: 520, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    // POSITIONEN
    let pos = 1
    let total = 0
    for (const item of items) {
      const cleanDescription = item.description.includes("(")
        ? item.description.split("(")[0].trim()
        : item.description
      page.drawText(`${pos}`, { x: 50, y, size: 11, font })
      page.drawText(cleanDescription, { x: 100, y, size: 11, font })
      page.drawText(item.price.toLocaleString("de-DE"), { x: 460, y, size: 11, font })
      total += item.price
      pos++
      y -= 20
    }

    // 🧮 STEUERLOGIK
    y -= 20
    page.drawLine({ start: { x: 50, y }, end: { x: 520, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 25

    const netto = total
    let ust = 0
    let brutto = total
    let steuerHinweis = ""

    const euCountries = [
      "Belgien","Bulgarien","Dänemark","Deutschland","Estland","Finnland","Frankreich","Griechenland","Irland",
      "Italien","Kroatien","Lettland","Litauen","Luxemburg","Malta","Niederlande","Polen","Portugal",
      "Rumänien","Schweden","Slowakei","Slowenien","Spanien","Tschechien","Ungarn","Zypern","Österreich"
    ]

    if (customerCountry === "Österreich") {
      ust = netto * 0.2
      brutto = netto + ust
      page.drawText(`Netto:`, { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(`+ 20% USt:`, { x: 400, y, size: 12, font })
      page.drawText(`${ust.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(`Gesamt:`, { x: 400, y, size: 12, font })
      page.drawText(`${brutto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    } else if (euCountries.includes(customerCountry)) {
      steuerHinweis =
        "According to the reverse charge system, tax liability transfers to the recipient of the services."
      page.drawText(`Netto:`, { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(`VAT: 0% (Reverse Charge)`, { x: 400, y, size: 12, font })
      y -= 15
      page.drawText(`Total:`, { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    } else {
      steuerHinweis =
        "Other service not taxable in the domestic territory pursuant to § 3a para. 6 UStG. The place of supply is located in a third country. No Austrian value added tax is charged."
      page.drawText(`Netto:`, { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(`VAT: 0%`, { x: 400, y, size: 12, font })
      y -= 15
      page.drawText(`Total:`, { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    }

    // Steuerhinweis ausgeben
    const wrapText = (text, maxWidth, fontRef, fontSize) => {
      const words = text.split(" ")
      const lines = []
      let current = ""
      for (const word of words) {
        const testLine = current + word + " "
        const w = fontRef.widthOfTextAtSize(testLine, fontSize)
        if (w > maxWidth && current !== "") {
          lines.push(current.trim())
          current = word + " "
        } else current = testLine
      }
      if (current.trim() !== "") lines.push(current.trim())
      return lines
    }

    if (steuerHinweis) {
      y -= 25
      const lines = wrapText(steuerHinweis, 450, font, 9)
      for (const line of lines) {
        page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) })
        y -= 12
      }
    }

    // FOOTER
    const footerParagraphs = [
      "Um Ihnen eine transparente und verbindliche Grundlage für unsere Zusammenarbeit zu bieten, möchten wir Sie darauf hinweisen, dass alle vertraglichen Vereinbarungen im Rahmen unserer Allgemeinen Geschäftsbedingungen (AGB) getroffen werden. Mit Ihrer Bestellung erklären Sie sich automatisch mit unseren AGBs einverstanden. Die AGBs können Sie hier einsehen: https://nordstein-agency.com/agbs",
      "Ihre Privatsphäre ist uns wichtig. Lesen Sie unsere Datenschutzbestimmungen unter https://nordstein-agency.com/datenschutz, um zu erfahren, wie wir Ihre Daten schützen.",
      "Wir danken Ihnen für Ihr Vertrauen.",
    ]

    let footerY = 160
    for (const paragraph of footerParagraphs) {
      const lines = wrapText(paragraph, 480, font, 9)
      for (const line of lines) {
        page.drawText(line, { x: 50, y: footerY, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        footerY -= 12
      }
      footerY -= 10
    }

    // ADRESSE + BANK
    page.drawText("Nordstein-Agency GmbH", { x: 50, y: 60, size: 10, font })
    page.drawText("Linzerstraße 11", { x: 50, y: 48, size: 10, font })
    page.drawText("4650 Edt bei Lambach", { x: 50, y: 36, size: 10, font })
    page.drawText("Österreich", { x: 50, y: 24, size: 10, font })

    page.drawText("Raiffeisenbank Gunskirchen", { x: 360, y: 60, size: 10, font })
    page.drawText("IBAN: AT23 3412 9000 0026 9548", { x: 360, y: 48, size: 10, font })
    page.drawText("BIC: RZOOAT2L129", { x: 360, y: 36, size: 10, font })

    const pdfBytes = await pdfDoc.save()
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=angebot_${customerName}.pdf`)
    res.send(Buffer.from(pdfBytes))
  } catch (err) {
    console.error("❌ Fehler beim PDF-Generieren:", err)
    res.status(500).json({ message: "Fehler beim Erstellen des PDFs", error: err.message })
  }
}


*/


import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { format } from "date-fns"

export const config = { api: { bodyParser: true } }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { customerName, customerAddress, customerCountry, items, language } = req.body
    const lang = language || "de"
    const date = format(new Date(), "dd.MM.yyyy")

    const offerNumber = `ANG-${format(new Date(), "yyyyMMdd")}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const { height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let y = height - 80

    // 🔹 LOGO
    try {
      const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/logo.png`
      const logoRes = await fetch(logoUrl)
      if (logoRes.ok) {
        const logoBytes = await logoRes.arrayBuffer()
        const logoImage = await pdfDoc.embedPng(logoBytes)
        const logoDims = logoImage.scale(0.15)
        page.drawImage(logoImage, {
          x: 50,
          y: height - 110,
          width: logoDims.width,
          height: logoDims.height,
        })
      } else {
        page.drawText("NORDSTEIN ONE", { x: 50, y, size: 20, font, color: rgb(0.27, 0.1, 0.24) })
      }
    } catch {
      page.drawText("NORDSTEIN ONE", { x: 50, y, size: 20, font, color: rgb(0.27, 0.1, 0.24) })
    }

    y -= 40
    page.drawText(
      `${lang === "de" ? "Angebot Nr.:" : "Offer No.:"} ${offerNumber}`,
      { x: 50, y, size: 14, font }
    )
    y -= 40
    page.drawText(`${lang === "de" ? "Kunde" : "Customer"}: ${customerName}`, {
      x: 50,
      y,
      size: 12,
      font,
    })
    y -= 15
    if (customerAddress) {
      page.drawText(`${lang === "de" ? "Adresse" : "Address"}: ${customerAddress}`, {
        x: 50,
        y,
        size: 11,
        font,
      })
      y -= 15
    }
    if (customerCountry) {
      page.drawText(`${lang === "de" ? "Land" : "Country"}: ${customerCountry}`, {
        x: 50,
        y,
        size: 11,
        font,
      })
      y -= 15
    }
    y -= 10
    page.drawText(`${lang === "de" ? "Datum" : "Date"}: ${date}`, { x: 50, y, size: 12, font })
    y -= 40

    // TABELLENKOPF
    page.drawText(lang === "de" ? "Pos." : "No.", { x: 50, y, size: 12, font })
    page.drawText(lang === "de" ? "Bezeichnung" : "Description", { x: 100, y, size: 12, font })
    page.drawText(lang === "de" ? "Preis (€)" : "Price (€)", { x: 450, y, size: 12, font })
    y -= 10
    page.drawLine({ start: { x: 50, y }, end: { x: 520, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    // POSITIONEN
    let pos = 1
    let total = 0
    for (const item of items) {
      const cleanDescription = item.description.includes("(")
        ? item.description.split("(")[0].trim()
        : item.description
      page.drawText(`${pos}`, { x: 50, y, size: 11, font })
      page.drawText(cleanDescription, { x: 100, y, size: 11, font })
      page.drawText(item.price.toLocaleString("de-DE"), { x: 460, y, size: 11, font })
      total += item.price
      pos++
      y -= 20
    }

    // 🧮 STEUERLOGIK
    y -= 20
    page.drawLine({ start: { x: 50, y }, end: { x: 520, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 25

    const netto = total
    let ust = 0
    let brutto = total
    let steuerHinweis = ""

    const euCountries = [
      "Belgien","Bulgarien","Dänemark","Deutschland","Estland","Finnland","Frankreich","Griechenland","Irland",
      "Italien","Kroatien","Lettland","Litauen","Luxemburg","Malta","Niederlande","Polen","Portugal",
      "Rumänien","Schweden","Slowakei","Slowenien","Spanien","Tschechien","Ungarn","Zypern","Österreich"
    ]

    if (customerCountry === "Österreich") {
      ust = netto * 0.2
      brutto = netto + ust
      page.drawText(lang === "de" ? "Netto:" : "Net:", { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(lang === "de" ? "+ 20% USt:" : "+ 20% VAT:", { x: 400, y, size: 12, font })
      page.drawText(`${ust.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(lang === "de" ? "Gesamt:" : "Total:", { x: 400, y, size: 12, font })
      page.drawText(`${brutto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    } else if (euCountries.includes(customerCountry)) {
      steuerHinweis =
        lang === "de"
          ? "Gemäß dem Reverse-Charge-System geht die Steuerschuld auf den Leistungsempfänger über."
          : "According to the reverse charge system, tax liability transfers to the recipient of the services."
      page.drawText(lang === "de" ? "Netto:" : "Net:", { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(lang === "de" ? "USt: 0% (Reverse Charge)" : "VAT: 0% (Reverse Charge)", {
        x: 400,
        y,
        size: 12,
        font,
      })
      y -= 15
      page.drawText(lang === "de" ? "Gesamt:" : "Total:", { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    } else {
      steuerHinweis =
        lang === "de"
          ? "Sonstige Leistung nicht steuerbar im Inland gemäß § 3a Abs. 6 UStG. Der Leistungsort liegt im Drittland. Es wird keine österreichische Umsatzsteuer berechnet."
          : "Other service not taxable in the domestic territory pursuant to § 3a para. 6 UStG. The place of supply is located in a third country. No Austrian value added tax is charged."
      page.drawText(lang === "de" ? "Netto:" : "Net:", { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
      y -= 15
      page.drawText(lang === "de" ? "USt: 0%" : "VAT: 0%", { x: 400, y, size: 12, font })
      y -= 15
      page.drawText(lang === "de" ? "Gesamt:" : "Total:", { x: 400, y, size: 12, font })
      page.drawText(`${netto.toLocaleString("de-DE")} €`, { x: 460, y, size: 12, font })
    }

    // WRAP-Funktion für Text
    const wrapText = (text, maxWidth, fontRef, fontSize) => {
      const words = text.split(" ")
      const lines = []
      let current = ""
      for (const word of words) {
        const testLine = current + word + " "
        const w = fontRef.widthOfTextAtSize(testLine, fontSize)
        if (w > maxWidth && current !== "") {
          lines.push(current.trim())
          current = word + " "
        } else current = testLine
      }
      if (current.trim() !== "") lines.push(current.trim())
      return lines
    }

    if (steuerHinweis) {
      y -= 25
      const lines = wrapText(steuerHinweis, 450, font, 9)
      for (const line of lines) {
        page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) })
        y -= 12
      }
    }

    // FOOTER (DE / EN)
    const footerParagraphs =
      lang === "de"
        ? [
            "Um Ihnen eine transparente und verbindliche Grundlage für unsere Zusammenarbeit zu bieten, möchten wir Sie darauf hinweisen, dass alle vertraglichen Vereinbarungen im Rahmen unserer Allgemeinen Geschäftsbedingungen (AGB) getroffen werden. Mit Ihrer Bestellung erklären Sie sich automatisch mit unseren AGBs einverstanden. Die AGBs können Sie hier einsehen: https://nordstein-agency.com/agbs",
            "Ihre Privatsphäre ist uns wichtig. Lesen Sie unsere Datenschutzbestimmungen unter https://nordstein-agency.com/datenschutz, um zu erfahren, wie wir Ihre Daten schützen.",
            "Wir danken Ihnen für Ihr Vertrauen.",
          ]
        : [
            "To provide a transparent and reliable basis for our collaboration, we would like to point out that all contractual agreements are concluded under our General Terms and Conditions (GTC). By placing your order, you automatically agree to our GTCs. You can view them here: https://nordstein-agency.com/agbs",
            "Your privacy is important to us. Please read our privacy policy at https://nordstein-agency.com/datenschutz to learn how we protect your data.",
            "Thank you for your trust.",
          ]

    let footerY = 160
    for (const paragraph of footerParagraphs) {
      const lines = wrapText(paragraph, 480, font, 9)
      for (const line of lines) {
        page.drawText(line, { x: 50, y: footerY, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
        footerY -= 12
      }
      footerY -= 10
    }

    // ADRESSE + BANK bleiben gleich
    page.drawText("Nordstein-Agency GmbH", { x: 50, y: 60, size: 10, font })
    page.drawText("Linzerstraße 11", { x: 50, y: 48, size: 10, font })
    page.drawText("4650 Edt bei Lambach", { x: 50, y: 36, size: 10, font })
    page.drawText("Österreich", { x: 50, y: 24, size: 10, font })

    page.drawText("Raiffeisenbank Gunskirchen", { x: 360, y: 60, size: 10, font })
    page.drawText("IBAN: AT23 3412 9000 0026 9548", { x: 360, y: 48, size: 10, font })
    page.drawText("BIC: RZOOAT2L129", { x: 360, y: 36, size: 10, font })

    const pdfBytes = await pdfDoc.save()
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${lang === "de" ? "angebot" : "offer"}_${customerName}.pdf`
    )
    res.send(Buffer.from(pdfBytes))
  } catch (err) {
    console.error("❌ Fehler beim PDF-Generieren:", err)
    res.status(500).json({ message: "Fehler beim Erstellen des PDFs", error: err.message })
  }
}
