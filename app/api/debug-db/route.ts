import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { promises as dns } from "dns";

export async function GET() {
  const steps: any[] = [];

  // 1) Internet reachable?
  try {
    const r = await fetch("https://api.github.com", { signal: AbortSignal.timeout(5000) });
    steps.push({ step: "GitHub API", ok: true, status: r.status });
  } catch (e: any) {
    steps.push({ step: "GitHub API", ok: false, error: e.message, cause: e.cause?.message });
  }

  // 2) DNS resolution of Supabase host
  const host = "pmbbvfgwlnrfkxnfqazk.supabase.co";
  try {
    const addrs = await dns.resolve4(host);
    steps.push({ step: "DNS A record", ok: true, ips: addrs });
  } catch (e: any) {
    steps.push({ step: "DNS A record", ok: false, error: e.message });
  }
  try {
    const addrs6 = await dns.resolve6(host);
    steps.push({ step: "DNS AAAA record", ok: true, ips: addrs6 });
  } catch {
    steps.push({ step: "DNS AAAA record", ok: false, error: "no AAAA" });
  }

  // 3) Supabase via raw fetch
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  steps.push({ step: "NEXT_PUBLIC_SUPABASE_URL", value: url ? `✅ (${url})` : "❌" });
  steps.push({ step: "SUPABASE_SERVICE_ROLE_KEY", value: key ? `✅ (${key.slice(0, 10)}...)` : "❌" });

  if (url) {
    const fullUrl = `${url}/rest/v1/`;
    steps.push({ step: "Fetch URL", value: fullUrl });
    try {
      const res = await fetch(fullUrl, {
        headers: { apikey: key || "", Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000),
      });
      steps.push({ step: "Supabase raw fetch", ok: true, status: res.status });
    } catch (e: any) {
      steps.push({ step: "Supabase raw fetch", ok: false, error: e.message, cause: e.cause?.message, code: e.code });
    }

    // 4) Supabase via official client
    try {
      const client = createClient(url, key || "", { auth: { persistSession: false } });
      const { data, error } = await client.from("sessions").select("id").limit(1);
      steps.push({ step: "Supabase JS client", ok: true, data, error: error?.message });
    } catch (e: any) {
      steps.push({ step: "Supabase JS client", ok: false, error: e.message });
    }

    // 5) Node.js https module direct request (bypasses global fetch)
    try {
      const https = await import("https");
      const urlObj = new URL(fullUrl);
      const result = await new Promise<any>((resolve, reject) => {
        const req = https.get(urlObj, { headers: { apikey: key || "", Authorization: `Bearer ${key}` } }, (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => resolve({ status: res.statusCode, body: body.slice(0, 200) }));
        });
        req.on("error", reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error("timeout")); });
      });
      steps.push({ step: "Supabase via https module", ok: true, status: result.status });
    } catch (e: any) {
      steps.push({ step: "Supabase via https module", ok: false, error: e.message });
    }
  }

  return NextResponse.json({ steps });
}
