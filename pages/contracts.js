



import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const euroStageMap = {
  'Sales Trainee I': 2,
  'Sales Trainee II': 3,
  'Sales Consultant': 4,
  'Sales Manager': 6,
  'Sales Director': 8,
  'Vice President': 10,
  'Senior Vice President': 12
}






// 💡 KORRIGIERTE HANDLE-DOWNLOAD-FUNKTION 💡
// Wir verwenden KEIN FETCH mehr, um Blob-Korruption bei Cross-Origin-Downloads
// von PCloud zu vermeiden. Stattdessen öffnen wir den Link direkt im Browser,
// der ihn korrekt als Download behandeln kann (da der Link mit &forcename 
// in create-concept.js bereits optimiert wurde).


/*
const handleDownload = (pdfUrl, title = 'vertrag') => {
  if (!pdfUrl) {
    alert('Kein PDF für diesen Vertrag hinterlegt.')
    return
  }

  // Wenn es eine HTTP-URL (PCloud-Link) ist, öffnen wir sie direkt.
  if (pdfUrl.startsWith('http')) {
    window.open(pdfUrl, '_blank')
    return
  }
  
  // Wenn es KEINE HTTP-URL (sondern ein Supabase Storage Pfad) ist, 
  // verwenden wir den ursprünglichen Supabase-Download-Mechanismus.
  try {
    const downloadSupabase = async () => {
      const { data, error } = await supabase.storage.from('contracts').download(pdfUrl)
      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    }
    downloadSupabase();
  } catch (err) {
    console.error('Fehler beim Herunterladen der PDF:', err)
    alert('Fehler beim Herunterladen der PDF.')
  }
}
*/



/*
const handleDownload = (fileUrl) => {
    // 1. Token entfernen (für Public Link Host)
    let downloadUrl = fileUrl.replace(/&access_token=[^&]+/, '');
    
    // 2. Host umstellen (nutze den Public Link Host, da Browser ihn auflösen kann)
    downloadUrl = downloadUrl.replace('eapi.pcloud.com', 'publnk.pcloud.com');
    
    // 3. Methode auf 'getpublink' umstellen (für Public Link Host)
    downloadUrl = downloadUrl.replace('/getpublinkdownload', '/getpublink');
    
    // 4. Download erzwingen
    if (!downloadUrl.includes('forcedownload=1')) {
        downloadUrl += '&forcedownload=1';
    }

    console.log('🔗 Frontend Download URL:', downloadUrl);
    window.open(downloadUrl, '_blank');
}
*/



const handleDownload = (path, name = 'vertrag.pdf') => {
  if (!path) return alert('❌ Kein gültiger Pfad!');
  
  // Nur „saubere“ Pfade zulassen
  if (path.startsWith('http')) {
    alert('❌ Download-Link ist bereits ein kompletter URL, kein pCloud-Pfad!');
    return;
  }

  // Immer Slash vorn und .pdf am Ende
  let cleanPath = path.trim();
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  if (!cleanPath.toLowerCase().endsWith('.pdf')) cleanPath += '.pdf';

  console.log('📂 Verwende bereinigten Pfad:', cleanPath);

  const url = `/api/download-pcloud-file?path=${encodeURIComponent(cleanPath)}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.target = '_blank';
  link.click();
};







export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customUserFilter, setCustomUserFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [customUser, setCustomUser] = useState(null)
  const [team, setTeam] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  // ---------------------------
  // Upload Modal
  // ---------------------------
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [existingCustomerId, setExistingCustomerId] = useState('')
  const [availableCustomers, setAvailableCustomers] = useState([])
  const [tarif, setTarif] = useState('')
  const [pdfFile, setPdfFile] = useState(null)

  // ---------------------------
  // Submit Modal
  // ---------------------------
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [units, setUnits] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [euroStage, setEuroStage] = useState('-')
  const [note, setNote] = useState('')

  // ---------------------------
  // Fetch Team
  // ---------------------------
  const fetchTeamForDropdown = async (currentUserId) => {
    let allPartners = []

    const fetchLevel = async (ids) => {
      if (!ids || ids.length === 0) return
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('leader', ids)
        .order('first_name', { ascending: true })
      if (data && data.length > 0) {
        allPartners.push(...data)
        const nextLevelIds = data.map((p) => p.id)
        await fetchLevel(nextLevelIds)
      }
    }
    await fetchLevel([currentUserId])

    const { data: selfData } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('id', currentUserId)
      .single()
    if (selfData) allPartners.unshift(selfData)

    return allPartners
  }

  // ---------------------------
  // Fetch Contracts
  // ---------------------------
  const fetchAllContracts = async (userId) => {
    setLoading(true)
    try {
      const teamMembers = await fetchTeamForDropdown(userId)
      setTeam(teamMembers)
      const teamIds = teamMembers.map(u => u.id)

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('*')
        .in('user_id', teamIds)
        .order('created_at', { ascending: false })

      const customerIds = [...new Set(contractsData.map(c => c.customer_id))]
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds)

      const contractsWithCustomer = contractsData.map(c => ({
        ...c,
        customer: customersData.find(cu => cu.id === c.customer_id)
      }))

      setContracts(contractsWithCustomer)
      setTotalPages(Math.ceil(contractsWithCustomer.length / pageSize))
    } catch (err) {
      console.error(err)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // Filters
  // ---------------------------
  const applyClientFilters = () => {
    if (!contracts) return setFiltered([])

    const s = (search || '').toLowerCase()
    const st = (statusFilter || '').toLowerCase()

    const out = contracts.filter(c => {
      if (s && !(c.customer?.name || '').toLowerCase().includes(s)) return false
      if (st && (c.state || '').toLowerCase() !== st) return false
      if (customUserFilter && c.user_id !== customUserFilter) return false
      return true
    })

    const start = (currentPage - 1) * pageSize
    setFiltered(out.slice(start, start + pageSize))
    setTotalPages(Math.ceil(out.length / pageSize))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) {
        setLoading(false)
        return
      }

      const { data: customData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()
      setCustomUser(customData)

      const teamData = await fetchTeamForDropdown(customData.id)
      setTeam(teamData)

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, user_id')
        .in('user_id', [customData.id, ...teamData.map(u => u.id)])
      if (customers) setAvailableCustomers(customers)

      setLoading(false)
      fetchAllContracts(customData.id)
    }
    init()
  }, [])

  useEffect(() => applyClientFilters(), [contracts, search, statusFilter, customUserFilter, currentPage])

  // ---------------------------
  // Upload Modal Logic
  // ---------------------------
  const openUploadModal = () => {
    setShowUploadModal(true)
    setIsNewCustomer(true)
    setCustomerName('')
    setExistingCustomerId('')
    setTarif('')
    setPdfFile(null)
  }




  const handleSaveUpload = async () => {
  if ((isNewCustomer && !customerName) || (!isNewCustomer && !existingCustomerId) || !tarif || !pdfFile) {
    alert('Bitte alle Pflichtfelder ausfüllen.')
    return
  }

  try {
    let finalCustomerId = existingCustomerId
    let finalCustomerName = customerName

    // 1️⃣ NEUEN KUNDEN ANLEGEN (falls nötig)
    if (isNewCustomer) {
      console.log('🆕 Neuer Kunde – wird in Supabase angelegt...')
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{ name: customerName, user_id: customUser.id }])
        .select()
        .single()

      if (customerError) throw customerError
      finalCustomerId = newCustomer.id
      finalCustomerName = newCustomer.name

      console.log('✅ Kunde in Supabase angelegt:', finalCustomerName)

      // 2️⃣ P-CLOUD-ORDNER ANLEGEN
      console.log('📁 Erstelle pCloud-Ordner für:', finalCustomerName)
      const folderRes = await fetch('/api/create-customer-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: finalCustomerId }),
      })

      const folderData = await folderRes.json()
      if (!folderRes.ok) {
        console.error('❌ Fehler beim Erstellen des pCloud-Ordners:', folderData)
        throw new Error(folderData.error || 'Fehler beim Erstellen des pCloud-Ordners')
      }

      console.log('✅ pCloud-Ordner erfolgreich erstellt:', folderData.folderId)
    } else {
      // Falls bestehender Kunde gewählt
      const found = availableCustomers.find((c) => c.id === existingCustomerId)
      finalCustomerName = found?.name || finalCustomerName
    }

    // 3️⃣ PDF IN PCLOUD HOCHLADEN
    console.log('⬆️ Lade PDF in pCloud hoch für:', finalCustomerName)
    const formData = new FormData()
    formData.append('customerName', finalCustomerName)

    // schöner Dateiname: <timestamp>_<tarif>.pdf
    const niceFileName = `${Date.now()}_${tarif}.pdf`
    formData.append('newFileName', niceFileName)
    formData.append('file', pdfFile)

    const uploadRes = await fetch('/api/upload-contract-pdf', {
      method: 'POST',
      body: formData,
    })

    const uploadJson = await uploadRes.json()
    if (!uploadRes.ok || !uploadJson.ok) {
      console.error('❌ Upload fehlgeschlagen:', uploadJson)
      throw new Error(uploadJson.message || 'Upload fehlgeschlagen')
    }

    const relativePath = uploadJson.relativePath
    const storedFileName = uploadJson.fileName
    console.log('✅ PDF erfolgreich hochgeladen:', relativePath)

    // 4️⃣ VERTRAG IN SUPABASE SPEICHERN
    console.log('📝 Speichere Vertrag in Supabase...')
    const { data: insertedContract, error: insertError } = await supabase
      .from('contracts')
      .insert([
        {
          user_id: customUser.id,
          customer_id: finalCustomerId,
          tarif,
          state: 'Antrag',
          pdf_url: relativePath,
          document_name: storedFileName,
          created_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .single()

    if (insertError) throw insertError
    console.log('✅ Vertrag angelegt:', insertedContract.id)

    // 5️⃣ UI AKTUALISIEREN
    await fetchAllContracts(customUser.id)
    setShowUploadModal(false)
    alert('✅ Antrag erfolgreich hochgeladen!')
  } catch (err) {
    console.error('❌ Fehler beim Hochladen:', err)
    alert('Fehler beim Hochladen: ' + err.message)
  }
}





  // ---------------------------
  // Submit Modal Logic
  // ---------------------------
  const openSubmitModal = () => {
  if (!selectedContract) return
  setUnits(selectedContract.eh || '')
  const user = team.find(u => u.id === selectedContract.user_id)
  setSelectedUser(user)
  setEuroStage(user ? euroStageMap[user.role] || '-' : '-') // <- HIER
  setNote(selectedContract.note || '')
  setShowSubmitModal(true)
}


  const handleSaveSubmitData = async () => {
    if (!selectedContract || !selectedUser) {
      alert('Bitte alle Pflichtfelder ausfüllen.')
      return
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          eh: units,
          user_id: selectedUser.id
        })
        .eq('id', selectedContract.id)
      if (error) throw error

      await supabase.from('customers').update({ user_id: selectedUser.id }).eq('id', selectedContract.customer_id)

      setContracts(prev =>
        prev.map(c => c.id === selectedContract.id ? { ...c, eh: units, user_id: selectedUser.id } : c)
      )
      setShowSubmitModal(false)
      alert('Daten erfolgreich gespeichert!')
    } catch (err) {
      console.error(err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }





const handleSendEmail = async () => {
  


  
  if (!selectedContract) return alert('Kein Vertrag ausgewählt!')

  try {
    const res = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: selectedContract.id })
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      
      // 2️⃣ Status des Vertrags auf "Gesendet" setzen
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ state: 'Gesendet' })
        .eq('id', selectedContract.id)

      if (updateError) throw updateError

      // Lokales Update
      setContracts(prev =>
        prev.map(c =>
          c.id === selectedContract.id ? { ...c, state: 'Gesendet' } : c
        )
      )

      console.log('✅ Vertragsstatus auf "Gesendet" gesetzt.')

    } else alert('Fehler: ' + data.error)



  } catch (err) {
    console.error(err)
    alert('Fehler beim Versenden der E-Mail')
  }


console.log('📦 create-projects request:', {
  contractId: selectedContract?.id,
  userId: selectedUser?.id,
})

  // 🆕 Projekte automatisch erstellen
  const createProjectsRes = await fetch('/api/create-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId: selectedContract.id, // ID des verschickten Vertrags
      userId: selectedUser?.id,   // aus deinem Modal ausgewählter Betreuer
    }),
  })

  const createProjectsData = await createProjectsRes.json()
  if (!createProjectsRes.ok) {
    console.error('❌ Fehler beim Erstellen der Projekte:', createProjectsData)
  } else {
    console.log('✅ Projekte erstellt:', createProjectsData.count)
  }

}


const handleEditPdf = async (contract) => {

  if (!contract?.pdf_url) {
    alert('Keine PDF zum Bearbeiten vorhanden.')
    return
  }

  // Wenn dein Editor wie in create-concept.js läuft (z. B. /pdf-editor),
  // öffnen wir ihn in einem neuen Tab mit dem pCloud-Pfad.
  //const pdfPath = encodeURIComponent(contract.pdf_url)
  const pdfFileName = contract.pdf_url.split('/').pop();

  const customerId = contract.customer_id
  const contractId = contract.id

  //const editorUrl = `/pdf-editor?path=${pdfPath}&customerId=${customerId}&contractId=${contractId}&mode=edit`
  //const editorUrl = `/pdf-editor?documentName=${pdfPath}&customerId=${customerId}&contractId=${contractId}&mode=edit`
  //const editorUrl = `/pdf-editor?documentName=${pdfPath}&customerId=${customerId}&customerName=${encodeURIComponent(contract.customer?.name || '')}&contractId=${contractId}&mode=edit`;
  const editorUrl = `/pdf-editor?documentName=${encodeURIComponent(pdfFileName)}&customerId=${customerId}&customerName=${encodeURIComponent(contract.customer?.name || '')}&contractId=${contractId}&mode=edit`;


  window.open(editorUrl, '_blank')
}



  const selectContract = (c) => setSelectedContract(c)

  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-2 py-1 border rounded ${currentPage === i ? 'font-bold bg-gray-200' : ''}`}
        >
          {i}
        </button>
      )
    }
    return pages
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#451a3d]">
      <h1 className="text-2xl font-bold mb-6">Verträge / Anträge</h1>

      <div className="mb-4">
        <button
          onClick={openUploadModal}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Antrag hochladen
        </button>
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 w-1/3 text-[#451a3d] placeholder-[#aaa]"
        />
      </div>

      {loading ? <div>Lädt...</div> : (
        <>
          <table className="w-full border-collapse bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3">Kunde</th>
                <th className="text-left p-3">Tarif</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Einheiten</th>
                <th className="text-left p-3">Betreuer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const leader = team.find(u => u.id === c.user_id)
                return (
                  <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => selectContract(c)}>
                    <td className="p-3">{c.customer?.name || '-'}</td>
                    <td className="p-3">{c.tarif}</td>
                    <td className="p-3">{c.state}</td>
                    <td className="p-3">{c.eh || '-'}</td>
                    <td className="p-3">{leader ? `${leader.first_name} ${leader.last_name}` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex gap-2 mt-4">{renderPagination()}</div>
        </>
      )}

      {/* Detailansicht */}
      {selectedContract && (
        <div className="bg-white rounded shadow mt-8 p-6 relative">
          <h1 className="text-xl font-bold mb-4 text-[#451a3d]">VERTRAG</h1>




          <div className="absolute top-4 right-4 flex gap-3">
  <button
    onClick={() => setSelectedContract(null)}
    className="bg-[#6b3c67] text-white px-5 py-2 font-medium border-none outline-none"
    style={{
      boxShadow: 'none',
      border: 'none',
      transition: 'background-color 0.2s ease',
    }}
    onMouseEnter={(e) => (e.target.style.backgroundColor = '#7e4a76')}
    onMouseLeave={(e) => (e.target.style.backgroundColor = '#6b3c67')}
  >
    Schließen
  </button>

  <button
    onClick={openSubmitModal}
    className="bg-[#451a3d] text-white px-5 py-2 font-medium border-none outline-none"
    style={{
      boxShadow: 'none',
      border: 'none',
      transition: 'background-color 0.2s ease',
    }}
    onMouseEnter={(e) => (e.target.style.backgroundColor = '#5e2a56')}
    onMouseLeave={(e) => (e.target.style.backgroundColor = '#451a3d')}
  >
    Einreichen
  </button>

  {/* NEU: BEARBEITEN */}
  <button
    onClick={() => handleEditPdf(selectedContract)}
    disabled={selectedContract.state !== 'Antrag'}
    className={`px-5 py-2 font-medium border-none outline-none ${
      selectedContract.state === 'Antrag'
        ? 'bg-[#7b4c75] text-white hover:bg-[#905b8a]'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`}
  >
    Bearbeiten
  </button>

  <button
    onClick={() => handleDownload(selectedContract.pdf_url, selectedContract.customer?.name || 'vertrag')}
    className="bg-[#8b5c87] text-white px-5 py-2 font-medium border-none outline-none"
    style={{
      boxShadow: 'none',
      border: 'none',
      transition: 'background-color 0.2s ease',
    }}
    onMouseEnter={(e) => (e.target.style.backgroundColor = '#9d6a99')}
    onMouseLeave={(e) => (e.target.style.backgroundColor = '#8b5c87')}
  >
    Download
  </button>
</div>







          <div className="grid grid-cols-3 gap-8 mb-6">
            <div>
              <p><strong>Kunde:</strong> {selectedContract.customer?.name || '-'}</p>
              <p><strong>Tarif:</strong> {selectedContract.tarif}</p>
              <p><strong>Status:</strong> {selectedContract.state}</p>
              <p><strong>Einheiten:</strong> {selectedContract.eh || '-'}</p>
              <p><strong>Betreuer:</strong> {team.find(u => u.id === selectedContract.user_id) ? `${team.find(u => u.id === selectedContract.user_id).first_name} ${team.find(u => u.id === selectedContract.user_id).last_name}` : '-'}</p>
            </div>
            <div>
              <p><strong>Notiz:</strong> {selectedContract.note || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Antrag hochladen</h2>
            <div className="mb-4">
              <label>Kunde *</label>
              <div className="flex gap-2">
                <label><input type="radio" checked={isNewCustomer} onChange={() => setIsNewCustomer(true)} /> Neukunde</label>
                <label><input type="radio" checked={!isNewCustomer} onChange={() => setIsNewCustomer(false)} /> Bestehender Kunde</label>
              </div>
              {isNewCustomer ? (
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="border rounded w-full max-w-[450px] px-3 py-2 mt-2" />
              ) : (
                <select value={existingCustomerId} onChange={e => setExistingCustomerId(e.target.value)} className="border rounded w-full max-w-[450px] px-3 py-2 mt-2">
                  <option value="">Bitte auswählen</option>
                  {availableCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            <div className="mb-4">
              <label>Tarif *</label>
              <input type="text" value={tarif} onChange={e => setTarif(e.target.value)} className="border rounded w-full max-w-[450px] px-3 py-2" />
            </div>

            <div className="mb-4">
              <label>PDF hochladen *</label>
              <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} />
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setShowUploadModal(false)} className="border px-4 py-2 rounded">Abbrechen</button>
              <button onClick={handleSaveUpload} className="border px-4 py-2 rounded">Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
{showSubmitModal && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white rounded shadow p-6 w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Vertrag einreichen</h2>

      <div className="mb-4 max-w-[450px]">
        <label>Einheiten</label>
        <input type="number" value={units} onChange={e => setUnits(e.target.value)} className="border rounded w-full px-3 py-2 mt-1" />
      </div>

      <div className="mb-4 max-w-[450px]">
        <label>Betreuer</label>


        <select
  value={selectedUser?.id || ''}
  onChange={(e) => {
    const user = team.find(u => u.id === e.target.value)
    setSelectedUser(user)
    setEuroStage(user ? euroStageMap[user.role] || '-' : '-') // <- HIER
  }}
  className="border rounded w-full px-3 py-2 mt-1"
>
  <option value="">Bitte auswählen</option>
  {team.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>)}
</select>



      </div>

      <div className="mb-4 max-w-[450px]">
        <label>Stufe (€)</label>
        <input type="text" value={euroStage} readOnly className="border rounded w-full px-3 py-2 mt-1 bg-gray-100" />
      </div>

      <div className="mb-4 max-w-[450px]">
        <label>Notiz</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} className="border rounded w-full px-3 py-2 mt-1" />
      </div>

      <div className="flex justify-end gap-4">
        <button onClick={() => setShowSubmitModal(false)} className="border px-4 py-2 rounded">Abbrechen</button>
        <button onClick={handleSaveSubmitData} className="border px-4 py-2 rounded">Speichern</button>
        <button onClick={handleSendEmail} className="border px-4 py-2 rounded bg-purple-100 hover:bg-purple-200">Versenden</button>
      </div>
    </div>
  </div>
)}





    </div>
  )
}
