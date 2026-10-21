import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("placeholder-auriclens") &&
    !supabaseUrl.includes("your-project-ref") &&
    supabaseUrl.startsWith("http")
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || "Not Configured",
    hasKey: Boolean(supabaseAnonKey) && !supabaseAnonKey.includes("placeholder"),
    isConfigured: isSupabaseConfigured(),
  };
};
