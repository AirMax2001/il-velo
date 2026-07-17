import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const TABLE = "npcs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const db = supabaseAdmin();
  const { data, error } = await db.from(TABLE).select().eq("session_id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();

  let locationId = body.location_id || null;
  let factionId = body.faction_id || null;

  // Resolve external_id → UUID for location_id
  if (locationId && !isUUID(locationId)) {
    const { data: loc } = await db.from("locations").select("id").eq("external_id", locationId).eq("session_id", body.session_id).maybeSingle();
    if (loc) locationId = loc.id;
    else locationId = null;
  }
  // Resolve external_id → UUID for faction_id
  if (factionId && !isUUID(factionId)) {
    const { data: fac } = await db.from("factions").select("id").eq("external_id", factionId).eq("session_id", body.session_id).maybeSingle();
    if (fac) factionId = fac.id;
    else factionId = null;
  }

  const { data, error } = await db.from(TABLE).insert({
    session_id: body.session_id,
    name: body.name,
    role: body.role || null,
    description: body.description || "",
    personality: body.personality || null,
    knows: body.knows || null,
    faction_id: factionId,
    location_id: locationId,
    is_dead: body.is_dead ?? false,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { id, ...fields } = body;
  const { error } = await db.from(TABLE).update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const db = supabaseAdmin();
  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}