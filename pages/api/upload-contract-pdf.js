import fetch from "node-fetch"
import FormData from "form-data"

export const config = {
  api: {
    bodyParser: false, // GANZ WICHTIG: wir lesen FormData manuell
  },
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Wir müssen den multipart/form-data Body manuell parsen.
    // Next.js macht das nicht automatisch, weil wir bodyParser: false gesetzt haben.
    // Wir bauen das hier minimal selber.

    const chunks = []
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk))
      req.on("end", resolve)
      req.on("error", reject)
    })
    const buffer = Buffer.concat(chunks)

    // boundary aus dem header holen
    const contentType = req.headers["content-type"] || ""
    const boundaryMatch = contentType.match(/boundary=(.*)$/)
    if (!boundaryMatch) {
      return res.status(400).json({ message: "No multipart boundary found" })
    }
    const boundary = boundaryMatch[1]

    // Wir parsen jetzt ganz simpel multipart.
    // Felder: customerName, newFileName, file (binary)

    // 1. split parts
    const parts = buffer.toString("binary").split(`--${boundary}`)

    let customerName = null
    let newFileName = null
    let fileBuffer = null
    let fileOriginalName = "upload.pdf"

    for (const part of parts) {
      if (part.includes('name="customerName"')) {
        const value = part.split("\r\n\r\n")[1]
        if (value) {
          customerName = value.replace(/\r\n--$/, "").trim()
        }
      }

      if (part.includes('name="newFileName"')) {
        const value = part.split("\r\n\r\n")[1]
        if (value) {
          newFileName = value.replace(/\r\n--$/, "").trim()
        }
      }

      if (part.includes('name="file"')) {
        // Header vs Body trennen
        const [rawHeaders, rawFileBody] = part.split("\r\n\r\n")
        if (rawHeaders && rawFileBody) {
          // Dateiname aus dem Header ziehen
          const fnMatch = rawHeaders.match(/filename="([^"]+)"/)
          if (fnMatch) {
            fileOriginalName = fnMatch[1]
          }

          // Der Body endet mit \r\n-- normalerweise -> abschneiden
          const cleanedBinary = rawFileBody.replace(/\r\n--$/, "")
          fileBuffer = Buffer.from(cleanedBinary, "binary")
        }
      }
    }

    // Validierung
    if (!customerName || !fileBuffer) {
      return res.status(400).json({ message: "Missing customerName or file" })
    }

    // finalen Dateinamen festlegen
    const finalFileName = newFileName
      ? newFileName.endsWith(".pdf")
        ? newFileName
        : `${newFileName}.pdf`
      : fileOriginalName.endsWith(".pdf")
        ? fileOriginalName
        : `${fileOriginalName}.pdf`

    // 1. Finde den pCloud-Ordner des Kunden (Genau wie in add-customer-docs)
    const listUrl = `${process.env.PCLOUD_API_URL}/listfolder?folderid=${process.env.PCLOUD_CUSTOMERS_FOLDER_ID}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`
    const listResp = await fetch(listUrl)
    const listData = await listResp.json()

    if (listData.result !== 0) {
      throw new Error(`Fehler beim Lesen des customers-Ordners: ${listData.error}`)
    }

    const safeName = customerName.trim()
    const folder = listData.metadata.contents.find(
      (item) => item.name === safeName && item.isfolder
    )

    if (!folder) {
      return res.status(404).json({ message: `Kein pCloud-Ordner für ${safeName} gefunden` })
    }

    const customerFolderId = folder.folderid

    // 2. Upload zur pCloud
    const form = new FormData()
    form.append("filename", finalFileName)
    form.append("file", fileBuffer, finalFileName)

    const uploadUrl = `${process.env.PCLOUD_API_URL}/uploadfile?folderid=${customerFolderId}&access_token=${process.env.PCLOUD_ACCESS_TOKEN}`

    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      body: form,
    })

    const uploadData = await uploadResp.json()

    if (uploadData.result !== 0) {
      console.error("❌ Upload-Fehler:", uploadData)
      throw new Error(`pCloud-Fehler: ${uploadData.result} - ${uploadData.error}`)
    }

    // pCloud meldet uns u.a. den Dateinamen zurück
    const storedFileName = uploadData.metadata?.[0]?.name || finalFileName

    // Wir geben hier etwas zurück, was wir dann in Supabase speichern können,
    // analog zu create-concept:
    // /customers/<KUNDENNAME>/<DATEINAME>.pdf
    const relativePath = `/customers/${safeName}/${storedFileName}`

    return res.status(200).json({
      ok: true,
      message: "Upload erfolgreich",
      fileName: storedFileName,
      relativePath,
      customerFolderId,
    })
  } catch (err) {
    console.error("❌ Fehler beim Upload-Vertrag:", err)
    return res.status(500).json({
      ok: false,
      message: "Fehler beim Upload",
      error: err.message,
    })
  }
}
