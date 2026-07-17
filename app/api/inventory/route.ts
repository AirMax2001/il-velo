import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const TABLE = "inventory_items";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const playerId = req.nextUrl.searchParams.get("playerId");
  const view = req.nextUrl.searchParams.get("view");
  const db = supabaseAdmin();

  const base = () => db.from(TABLE).select().eq("session_id", sessionId).order("created_at", { ascending: false });

  if (view === "dm") {
    const { data, error } = await base();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data });
  }

  if (playerId) {
    let { data, error } = await base().eq("player_id", playerId).eq("hidden", false);
    if (error && (error.message?.includes("hidden") || error.message?.includes("column"))) {
      const fallback = await base().eq("player_id", playerId);
      return NextResponse.json({ items: fallback.data || [] });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data });
  }

  const { data, error } = await base().not("player_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db.from(TABLE).insert({
    session_id: body.session_id,
    player_id: body.player_id || null,
    name: body.name,
    description: body.description || "",
    rarity: body.rarity || "common",
    category: body.category || "general",
    item_type: body.item_type || body.type || "other",
    is_relic: body.rarity === "relic" || body.is_relic || false,
    hidden: false,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
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
