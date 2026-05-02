import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sgrcwuvafthbmxbfdebg.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncmN3dXZhZnRoYm14YmZkZWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTk5MzQsImV4cCI6MjA5MzIzNTkzNH0.-SWQOrpMmDv5ye1EIXnY6_Tcn0phAoAkPAgacjZmrpA";

export const isMisconfigured = false;

let _client: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    if (!_client) {
      _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return (_client as any)[prop];
  },
});
