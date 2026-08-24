import { createClient } from "@supabase/supabase-js";

// Used in server components for read queries. Still respects RLS
// (anon key), it just runs on the server instead of the browser.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı."
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false }
  });
}

// SERVER ONLY. Uses the service role key, which bypasses Row Level
// Security. Never import this file from a "use client" component,
// and never send SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase env vars eksik. NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });
}
