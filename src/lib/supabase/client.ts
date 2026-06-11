import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || typeof supabaseUrl !== 'string') {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Check your .env file.')
}
if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
