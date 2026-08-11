import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://inooaqxhjkdezofapayi.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "PLACEHOLDER";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  }
  return client;
}

export const supabase = () => getSupabase();
