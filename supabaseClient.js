import { createClient } from '@supabase/supabase-js'

// Gunakan credentials Anda
const supabaseUrl = 'https://nrqeufnzsagdxdkxhbkh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycWV1Zm56c2FnZHhka3hoYmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDM2MjMsImV4cCI6MjA3MTQxOTYyM30.3uOHn_uto6J10vBNLPSnrde70voZnoU1XTb5N7yNMAI'

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)