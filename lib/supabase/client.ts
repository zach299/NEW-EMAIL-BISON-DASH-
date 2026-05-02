import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isMisconfigured = !SUPABASE_URL || !SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    if (!_client) {
      if (isMisconfigured) {
        throw new Error(
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Set these environment variables in your Vercel project settings."
        );
      }
      _client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    }
    return (_client as any)[prop];
  },
});
