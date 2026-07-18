import { createClient } from "@supabase/supabase-js";

function requireValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required to connect The Veil to Supabase.`);
  }
  return value;
}

export function supabaseClient() {
  return createClient(
    requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireValue("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

let _adminClient: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (_adminClient) return _adminClient;
  _adminClient = createClient(
    requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireValue("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: { persistSession: false },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          return fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
        },
      },
    }
  );
  return _adminClient;
}

// Helper per sottoscrizioni realtime lato client (usa l'anon key + le policy
// "public read" definite in supabase/schema.sql). Ritorna la funzione di unsubscribe.
export function subscribeToTable(
  table: string,
  sessionId: string,
  onChange: () => void
) {
  const client = supabaseClient();
  const channel = client
    .channel(`${table}-${sessionId}`)
    .on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table, filter: `session_id=eq.${sessionId}` },
      onChange
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
