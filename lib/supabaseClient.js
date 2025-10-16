import { createClient } from '@supabase/supabase-js'

// Supabase URL und Public Key aus Vercel Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase Client erzeugen
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
