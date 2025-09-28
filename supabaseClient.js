import { createClient } from '@supabase/supabase-js'

// ✅ Pakai environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)