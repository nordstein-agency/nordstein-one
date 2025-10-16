import Layout from '../components/Layout';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionUser = supabase.auth.user();
    setUser(sessionUser);
  }, []);

  return (
    <Layout>
      <div className="px-8 py-12">
        <h1 className="text-white text-4xl mb-8">
          Willkommen, {user?.email}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">Kunden</div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">Verträge</div>
          <div className="bg-[#e6ded3] p-6 rounded-lg shadow">Karriere</div>
        </div>
      </div>
    </Layout>
  );
}
