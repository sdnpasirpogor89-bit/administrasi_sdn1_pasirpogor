// src/supabaseClient.js - FIXED ✅
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials!");
  throw new Error("Supabase environment variables are required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

// ✅ Expose supabase ke window untuk debugging
if (typeof window !== "undefined") {
  window.supabase = supabase;
  console.log("✅ Supabase client exposed to window.supabase");
}
