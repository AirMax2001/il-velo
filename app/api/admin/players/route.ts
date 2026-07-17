import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expectedPassword = process.env.DM_PASSWORD;
  if (!expectedPassword) return { ok: true };
  if (auth !== `Bearer ${expectedPassword}`) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "all";
  const sessionId = req.nextUrl.searchParams.get("sessionId") || "";

  const db = supabaseAdmin();
  let query = db
    .from("players")
    .select("*, sessions!inner(name, code, created_at)")
    .order("created_at", { ascending: false });

  if (sessionId) query = query.eq("session_id", sessionId);
  if (search) {
    const s = `%${search}%`;
    query = query.or(`character_name.ilike.${s},player_name.ilike.${s},race.ilike.${s},class.ilike.${s}`);
  }
  if (status === "suspended") query = query.eq("suspended", true);
  if (status === "active") query = query.eq("suspended", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ players: data || [] });
}

export async function PATCH(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const db = supabaseAdmin();
  const { id, ...fields } = body;

  if (!id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );

  const { error } = await db.from("players").update(cleanFields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = req.nextUrl.searchParams.get("id");
  const cascade = req.nextUrl.searchParams.get("cascade") === "true";

  if (!id) return NextResponse.json({ error: "ID richiesto" }, { status: 400 });

  const db = supabaseAdmin();
  if (cascade) {
    await db.from("inventory_items").delete().eq("player_id", id);
    await db.from("memory_entries").delete().eq("player_id", id);
    await db.from("echo_messages").delete().eq("player_id", id);
    await db.from("secrets").delete().eq("player_id", id);
    await db.from("player_diary_entries").delete().eq("player_id", id);
    await db.from("player_thoughts").delete().eq("player_id", id);
    await db.from("roleplay_messages").delete().eq("player_id", id);
    await db.from("entity_links").delete().or(`source_id.eq.${id},target_id.eq.${id}`);
  }

  const { error } = await db.from("players").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
