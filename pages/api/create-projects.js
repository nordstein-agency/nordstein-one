// pages/api/create-projects.js
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // 1) Wir lesen aus dem Request, was der Client uns schickt
    const { contractId, userId } = req.body

    // Sicherheits-Checks
    if (!contractId || !userId) {
      return res.status(400).json({ message: 'contractId und userId sind erforderlich' })
    }

    // 2) Vertrag holen (damit wir wissen: welcher Kunde? welche Services?)
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, customer_id, services_selected')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      console.error('❌ Vertrag nicht gefunden:', contractError)
      return res.status(404).json({ message: 'Vertrag nicht gefunden' })
    }

    const selectedServices = contract.services_selected || []

    // Falls beim Vertrag keine Services gespeichert sind -> einfach nichts erzeugen
    if (selectedServices.length === 0) {
      return res.status(200).json({
        ok: true,
        count: 0,
        message: 'Keine Leistungen im Vertrag gespeichert.',
      })
    }

    // 3) Alle Services holen (damit wir von jedem Titel die description bekommen)
    const { data: allServices, error: serviceError } = await supabase
      .from('services')
      .select('title, description')

    if (serviceError) {
      console.error('❌ Fehler beim Laden der Services:', serviceError)
      return res.status(500).json({ message: 'Fehler beim Laden der Services' })
    }

    // 4) Nur die Services behalten, die wirklich ausgewählt wurden
    const matchingServices = allServices.filter((s) =>
      selectedServices.includes(s.title)
    )

    // 5) Projekte vorbereiten (jedes ausgewählte Service = 1 Projekt)
    const projectsToInsert = matchingServices.map((service) => ({
      customer_id: contract.customer_id, // vom Vertrag
      user_id: userId,                   // Betreuer aus dem Modal
      title: service.description,        // WICHTIG: description rein, nicht title
    }))

    // 6) In die Tabelle "projects" schreiben
    const { error: insertError } = await supabase
      .from('projects')
      .insert(projectsToInsert)

    if (insertError) {
      console.error('❌ Fehler beim Erstellen der Projekte:', insertError)
      return res.status(500).json({ message: 'Fehler beim Erstellen der Projekte' })
    }

    // 7) Antwort zurück
    console.log(`✅ ${projectsToInsert.length} Projekte erstellt.`)
    return res.status(200).json({ ok: true, count: projectsToInsert.length })
  } catch (err) {
    console.error('❌ Unerwarteter Fehler:', err)
    return res.status(500).json({ message: err.message })
  }
}
