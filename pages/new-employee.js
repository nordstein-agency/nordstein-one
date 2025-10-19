


import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import crypto from 'crypto';




export default function NewEmployee() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    leader: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    sv_nr: '',
    country: '',
    private_adress: '',
    phone: '',
    email: '',
    iban: '',
    bic: '',
    bank_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Aktuellen User laden
  useEffect(() => {
    async function fetchUser() {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      else setCurrentUser(userData.user);
    }
    fetchUser();
  }, []);

  // Alle eigenen direkten und indirekten Mitarbeiter laden
  useEffect(() => {
    if (!currentUser) return;

    async function fetchEmployees() {
      // Me selbst holen
      const { data: meData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('email', currentUser.email)
        .single();

      // Rekursive Funktion, um alle indirekten Mitarbeiter zu bekommen
      async function getAllTeam(userId) {
        const { data } = await supabase.from('users').select('id, first_name, last_name').eq('leader', userId);
        let result = data || [];
        for (const u of result) {
          const sub = await getAllTeam(u.id);
          result = result.concat(sub);
        }
        return result;
      }

      const team = await getAllTeam(meData.id);
      setEmployees([meData, ...team]); // mich selbst + alle Mitarbeiter
    }

    fetchEmployees();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  
  
  
  
  
  
  


const handleSubmit = async () => {
  // Alle Felder prüfen
  for (let key in formData) {
    if (!formData[key]) {
      alert(`Bitte das Feld "${key}" ausfüllen`);
      return;
    }
  }

  setLoading(true);

  try {
    // 1️⃣ Nordstein-ID generieren
    const { data: lastUser } = await supabase
      .from('users')
      .select('nordstein_id')
      .not('nordstein_id', 'is', null)
      .order('nordstein_id', { ascending: false })
      .limit(1)
      .single();

    let newNordsteinId = 'N000001';
    if (lastUser?.nordstein_id) {
      const lastNum = parseInt(lastUser.nordstein_id.slice(1));
      const nextNum = (lastNum + 1).toString().padStart(6, '0');
      newNordsteinId = `N${nextNum}`;
    }

    // 2️⃣ User in users Tabelle anlegen
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        ...formData,
        nordstein_id: newNordsteinId
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 3️⃣ Auth-User über API erstellen

    console.log(formData.email)
    const resAuth = await fetch('/api/create-auth-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email })
    });


    console.log('resAuth.status', resAuth.status);

    const authData = await resAuth.json();

    console.log('authData', authData);


    if (!resAuth.ok) throw new Error(authData.error || 'Auth-User Fehler');

    // 4️⃣ Erfolg
    alert(`Vertriebspartner erfolgreich angelegt!`);
    router.push('/profile');

  } catch (err) {
    console.error(err);
    alert('Fehler beim Anlegen: ' + err.message);
  } finally {
    setLoading(false);
  }
};





  if (!currentUser) return <p>Lädt...</p>;

  return (
    <div className="p-10 text-[#451a3d] font-['Inter_Tight'] max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 bg-[#451a3d] text-white px-4 py-2 rounded-none border-0 outline-none shadow-none 
                   hover:bg-[#5a1f4f] focus:outline-none focus:ring-0 active:shadow-none 
                   transition-colors font-['Inter_Tight']"
      >
        ← Zurück
      </button>

      <h1 className="text-4xl font-bold mb-8">Neuen Vertriebspartner anlegen</h1>

      <label className="block mb-2 font-medium">Direkte Unterstellung</label>
      <select
        name="leader"
        value={formData.leader}
        onChange={handleChange}
        className="w-full border border-[#451a3d]/40 p-3 bg-white rounded-none focus:ring-0 focus:border-[#451a3d] outline-none mb-4"
        required
      >
        <option value="">Bitte auswählen...</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.first_name} {e.last_name}
          </option>
        ))}
      </select>

      {[
        { name: 'first_name', label: 'Vorname' },
        { name: 'last_name', label: 'Nachname' },
        { name: 'birth_date', label: 'Geburtsdatum' },
        { name: 'sv_nr', label: 'Sozialversicherungsnummer' },
        { name: 'country', label: 'Land' },
        { name: 'private_adress', label: 'Adresse' },
        { name: 'phone', label: 'Telefon' },
        { name: 'email', label: 'Email' },
        { name: 'iban', label: 'IBAN' },
        { name: 'bic', label: 'BIC' },
        { name: 'bank_name', label: 'Bank' }
      ].map((field) => (
        <div key={field.name} className="mb-4">
          <label className="block mb-1 font-medium">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            className="w-full border border-[#451a3d]/40 p-3 bg-white rounded-none focus:ring-0 focus:border-[#451a3d] outline-none"
            required
          />
        </div>
      ))}

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-[#451a3d] px-4 py-2 rounded-none border-0 outline-none shadow-none 
                     hover:bg-gray-400 transition-colors font-['Inter_Tight']"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-[#451a3d] text-white px-4 py-2 rounded-none border-0 outline-none shadow-none 
                     hover:bg-[#5a1f4f] transition-colors font-['Inter_Tight']"
          disabled={loading}
        >
          {loading ? 'Lädt...' : 'Fertigstellen'}
        </button>
      </div>
    </div>
  );
}
