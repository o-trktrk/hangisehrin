import { createClient } from "@supabase/supabase-js";

// Safe to use in the browser: only the public anon key is used here,
// and Row Level Security policies decide what it's allowed to do.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı."
    );
  }

  return createClient(url, anonKey);
}
