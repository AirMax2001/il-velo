import { NextResponse } from "next/server";

export async function GET() {
  const steps = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    steps.push({ step: "NEXT_PUBLIC_SUPABASE_URL", value: url ? "✅ impostato" : "❌ mancante" });

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    steps.push({ step: "SUPABASE_SERVICE_ROLE_KEY", value: key ? `✅ impostato (${key.slice(0, 10)}...)` : "❌ mancante" });

    if (url) {
      try {
        const res = await fetch(`${url}/rest/v1/`, {
          headers: { "apikey": key || "" },
        });
        steps.push({
          step: "Supabase REST API reachable",
          status: res.status,
          ok: res.ok ? "✅" : "❌",
        });
      } catch (e: any) {
        steps.push({
          step: "Supabase REST API fetch error",
          error: e.message,
          cause: e.cause?.message || e.cause,
        });
      }
    }

    return NextResponse.json({ steps });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
