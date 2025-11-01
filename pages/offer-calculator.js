import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function OfferCalculator() {
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [prices, setPrices] = useState([])

  // 🧩 Team-Struktur abrufen (rekursiv)
  const fetchTeamRecursive = async (leaderIds) => {
    if (!leaderIds || leaderIds.length === 0) return []
    const { data } = await supabase.from("users").select("id").in("leader", leaderIds)
    if (!data || data.length === 0) return []
    const nextIds = data.map((u) => u.id)
    const deeper = await fetchTeamRecursive(nextIds)
    return [...data, ...deeper]
  }

  // 🔹 Aktuellen User + Team abrufen
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) return

      const { data: userData } = await supabase
        .from("users")
        .select("id, email, leader")
        .eq("email", authUser.email)
        .single()

      if (!userData) return
      setCurrentUser(userData)

      // Team-Struktur abrufen
      const allLevels = await fetchTeamRecursive([userData.id])
      const allUserIds = [userData.id, ...allLevels.map((u) => u.id)]

      // Kunden laden
      const { data: customerData, error } = await supabase
        .from("customers")
        .select("id, name, user_id")
        .in("user_id", allUserIds)
        .order("name", { ascending: true })

      if (error) console.error("Fehler beim Laden der Kunden:", error)
      setCustomers(customerData || [])
    }

    fetchCustomers()
  }, [])

  // 🔹 Services & Preise laden
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: servicesData, error: sErr }, { data: pricesData, error: pErr }] =
        await Promise.all([
          supabase.from("services").select("title, description"),
          supabase.from("agency_prices").select("service, price"),
        ])

      if (sErr) console.error("Fehler beim Laden der Services:", sErr)
      if (pErr) console.error("Fehler beim Laden der Preise:", pErr)

      setServices(servicesData || [])
      setPrices(pricesData || [])
    }

    fetchData()
  }, [])

  // 🔹 Service toggeln
  const toggleService = (title) => {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
  }

  // 🔹 Preislogik: höchsten Preis finden
  const getHighestPrice = (serviceTitle) => {
    const matching = prices.filter((p) => p.service === serviceTitle)
    if (matching.length === 0) return 0
    return Math.max(...matching.map((p) => p.price || 0))
  }

  // 🔹 Preis-Summe berechnen
  const total = selectedServices.reduce((sum, title) => sum + getHighestPrice(title), 0)

  // 🔹 Services nach Kategorie gruppieren
  const webdesign = services.filter((s) =>
    ["web_small", "web_medium", "web_big", "wordpress", "booking_tool"].includes(s.title)
  )
  const content = services.filter((s) =>
    [
      "videoshoot_full",
      "videoshoot_half",
      "fotoshoot_full",
      "fotoshoot_half",
      "production_full",
      "production_half",
      "social_small",
      "social_big",
      "graphic_ad",
      "logo",
    ].includes(s.title)
  )
  const marketing = services.filter((s) =>
    [
      "setup_small",
      "setup_big",
      "campaign_small",
      "campaign_medium",
      "campaign_big",
      "seo_small",
      "seo_medium",
      "seo_big",
      "email_small",
      "email_big",
      "wa_small",
      "wa_big",
    ].includes(s.title)
  )

  // 🔹 Button Handler (Platzhalter)
  const handleDownload = async() => {
    if (selectedServices.length === 0) {
    alert("Bitte mindestens eine Leistung auswählen.")
    return
  }

  const customerName = customers.find(c => c.id === selectedCustomer)?.name || "Unbekannt"
  const items = selectedServices.map((s, i) => ({
    description: services.find(x => x.title === s)?.description || s,
    price: getHighestPrice(s)
  }))

  const res = await fetch("/api/generate-offer-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName, items })
  })

  if (!res.ok) {
    alert("Fehler beim Generieren des PDFs.")
    return
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `angebot_${customerName}.pdf`
  link.click()
  window.URL.revokeObjectURL(url)

  }

  const handleAddToCustomer = () => {
    if (!selectedCustomer) {
      alert("Bitte zuerst einen Kunden auswählen.")
      return
    }
    alert(`✅ Angebot für Kunde "${customers.find(c => c.id === selectedCustomer)?.name}" gespeichert!`)
  



    // Hier würde die Logik zum Speichern des Angebots im Kundenprofil kommen




    }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Angebotsrechner</h1>

      {/* Kunde wählen */}
      <div className="mb-8 max-w-sm">
        <label className="block mb-2 font-semibold text-[#451a3d]">Kunde wählen</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full bg-[#f9f7f8] text-[#451a3d] border border-[#d9c8d5] py-2 px-3 focus:outline-none"
        >
          <option value="">Bitte auswählen</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Leistungen */}
      <h2 className="text-xl font-semibold mb-4">Leistungen wählen</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Webdesign */}
        <div className="bg-white border border-[#d9c8d5] p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">Webdesign</h3>
          <div className="flex flex-col gap-2">
            {webdesign.map((service) => (
              <label key={service.title} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.title)}
                  onChange={() => toggleService(service.title)}
                  className="accent-[#451a3d]"
                />
                <span>{service.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Content Creation */}
        <div className="bg-white border border-[#d9c8d5] p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">Content Creation</h3>
          <div className="flex flex-col gap-2">
            {content.map((service) => (
              <label key={service.title} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.title)}
                  onChange={() => toggleService(service.title)}
                  className="accent-[#451a3d]"
                />
                <span>{service.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Online Marketing */}
        <div className="bg-white border border-[#d9c8d5] p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">Online Marketing</h3>
          <div className="flex flex-col gap-2">
            {marketing.map((service) => (
              <label key={service.title} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.title)}
                  onChange={() => toggleService(service.title)}
                  className="accent-[#451a3d]"
                />
                <span>{service.description}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Ausgewählte Leistungen */}
      <div className="mt-8 p-4 border border-[#d9c8d5] bg-[#f9f7f8]">
        <h3 className="font-semibold mb-2">Ausgewählte Leistungen:</h3>
        {selectedServices.length > 0 ? (
          <ul className="list-disc ml-5 space-y-1">
            {selectedServices.map((s) => {
              const service = services.find((x) => x.title === s)
              const price = getHighestPrice(s)
              return (
                <li key={s}>
                  {service?.description || s} –{" "}
                  <span className="font-semibold">{price.toLocaleString("de-DE")} €</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Noch keine Leistungen ausgewählt.</p>
        )}

        {selectedServices.length > 0 && (
          <div className="mt-4 border-t border-[#d9c8d5] pt-2 text-right font-bold text-lg">
            Gesamt: {total.toLocaleString("de-DE")} €
          </div>
        )}
      </div>

      {/* Buttons unten */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={handleDownload}
          className="bg-[#6b3c67] text-white px-6 py-2 font-medium border-none outline-none hover:bg-[#7e4a76] transition-all"
        >
          Download
        </button>
        <button
          onClick={handleAddToCustomer}
          className="bg-[#451a3d] text-white px-6 py-2 font-medium border-none outline-none hover:bg-[#5e2a56] transition-all"
        >
          Zum Kundenprofil hinzufügen
        </button>
      </div>
    </div>
  )
}
