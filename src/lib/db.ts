import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://inooaqxhjkdezofapayi.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlub29hcXhoamtkZXpvZmFwYXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDk4MjIsImV4cCI6MjA2NTI4NTgyMn0.sb_publishable_oMbUZFXS8V1bi15bh_fzBQ_o_Z2HkB7";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  }
  return client;
}

// Also export for direct use
export const supabase = () => getSupabase();
