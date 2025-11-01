
/*

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
        .select("id, name, user_id, adress, country") // ⬅️ Land & Adresse mitladen
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
  const handleDownload = async () => {
    if (selectedServices.length === 0) {
      alert("Bitte mindestens eine Leistung auswählen.")
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomer)
    const customerName = customer?.name || "Unbekannt"
    const customerAddress = customer?.adress || ""
    const customerCountry = customer?.country || ""

    const items = selectedServices.map((s) => ({
      description: services.find((x) => x.title === s)?.description || s,
      price: getHighestPrice(s),
    }))

    const res = await fetch("/api/generate-offer-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerAddress, customerCountry, items }), // ⬅️ Adresse & Land übergeben
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
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Angebotsrechner</h1>

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

      <h2 className="text-xl font-semibold mb-4">Leistungen wählen</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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


*/

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function OfferCalculator() {
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [prices, setPrices] = useState([])
  const [language, setLanguage] = useState("de") // 🇩🇪 Standard: Deutsch

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

      const allLevels = await fetchTeamRecursive([userData.id])
      const allUserIds = [userData.id, ...allLevels.map((u) => u.id)]

      const { data: customerData, error } = await supabase
        .from("customers")
        .select("id, name, user_id, adress, country")
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

  const toggleService = (title) => {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    )
  }

  const getHighestPrice = (serviceTitle) => {
    const matching = prices.filter((p) => p.service === serviceTitle)
    if (matching.length === 0) return 0
    return Math.max(...matching.map((p) => p.price || 0))
  }

  const total = selectedServices.reduce((sum, title) => sum + getHighestPrice(title), 0)

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

  // 🔹 Download PDF
  const handleDownload = async () => {
    if (selectedServices.length === 0) {
      alert("Bitte mindestens eine Leistung auswählen.")
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomer)
    const customerName = customer?.name || "Unbekannt"
    const customerAddress = customer?.adress || ""
    const customerCountry = customer?.country || ""




/*
    const items = selectedServices.map((s) => ({
      description: services.find((x) => x.title === s)?.description || s,
      price: getHighestPrice(s),
    }))
*/


// 🔹 Übersetzungen für englische PDFs
const serviceTranslations = {
  // --- Webdesign ---
  web_small: "Basic website (1–3 pages)",
  web_medium: "Standard website (up to 6 pages)",
  web_big: "Large website (custom design)",
  wordpress: "WordPress website setup",
  booking_tool: "Online booking tool",

  // --- Content Creation ---
  videoshoot_full: "Full video shoot (1 day)",
  videoshoot_half: "Half-day video shoot",
  fotoshoot_full: "Full photo shoot (1 day)",
  fotoshoot_half: "Half-day photo shoot",
  production_full: "Full content production",
  production_half: "Half content production",
  social_small: "Social media package (small)",
  social_big: "Social media package (large)",
  graphic_ad: "Graphic ad creation",
  logo: "Logo design",

  // --- Online Marketing ---
  setup_small: "Basic marketing setup",
  setup_big: "Comprehensive marketing setup",
  campaign_small: "Small advertising campaign",
  campaign_medium: "Medium advertising campaign",
  campaign_big: "Large advertising campaign",
  seo_small: "Basic SEO optimization",
  seo_medium: "Advanced SEO optimization",
  seo_big: "Professional SEO package",
  email_small: "Basic email marketing",
  email_big: "Advanced email marketing",
  wa_small: "WhatsApp marketing (small)",
  wa_big: "WhatsApp marketing (large)",
}

const items = selectedServices.map((s) => {
  const germanDescription = services.find((x) => x.title === s)?.description || s
  const englishDescription = serviceTranslations[s] || germanDescription
  return {
    description: language === "en" ? englishDescription : germanDescription,
    price: getHighestPrice(s),
  }
})



    const res = await fetch("/api/generate-offer-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerAddress, customerCountry, items, language }), // ⬅️ Sprache mitschicken
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
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Angebotsrechner</h1>

      {/* Kunde & Sprache */}
      <div className="mb-8 flex flex-col md:flex-row gap-6 items-end">
        <div className="max-w-sm w-full">
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

        {/* Sprachwahl */}
        <div>
          <label className="block mb-2 font-semibold text-[#451a3d]">Sprache</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#f9f7f8] text-[#451a3d] border border-[#d9c8d5] py-2 px-3 focus:outline-none"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
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
