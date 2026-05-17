import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (cachedClient) return cachedClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

    if (!url || !key) {
        throw new Error("Missing Supabase environment variables.");
    }

    cachedClient = createClient(url, key, {
        auth: { persistSession: false },
    });

    return cachedClient;
}
