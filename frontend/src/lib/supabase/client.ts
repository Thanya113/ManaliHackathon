import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";


export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
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
    if (typeof window !== "undefined") {
      clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
    } else {
      clientInstance = createClient(supabaseUrl, supabaseKey);
    }
  }
  return clientInstance;
};

export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || "Not Configured",
    hasKey: Boolean(supabaseKey) && !supabaseKey.includes("placeholder"),
    isConfigured: isSupabaseConfigured(),
  };
};

