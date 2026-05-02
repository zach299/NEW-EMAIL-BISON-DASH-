import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sgrcwuvafthbmxbfdebg.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncmN3dXZhZnRoYm14YmZkZWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk5MzQsImV4cCI6MjA5MzIzNTkzNH0.-SWQOrpMmDv5ye1EIXnY6_Tcn0phAoAkPAgacjZmrpA";

export function createServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}
