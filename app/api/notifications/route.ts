import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const TABLE = "notifications";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const playerId = req.nextUrl.searchParams.get("playerId");
  const db = supabaseAdmin();
  let query = db.from(TABLE).select().eq("session_id", sessionId).order("created_at", { ascending: false });

  if (playerId) {
    query = query.or(`player_id.eq.${playerId},target_player_ids.cs.{${playerId}},target_type.eq.party`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();

  if (body.target_type === "party") {
    const { data: players } = await db.from("players").select("id").eq("session_id", body.session_id);
    body.target_player_ids = (players || []).map((p: any) => p.id);
  }

  const { data, error } = await db.from(TABLE).insert({
    session_id: body.session_id,
    player_id: body.player_id || null,
    target_type: body.target_type || "single",
    target_player_ids: body.target_player_ids || [],
    title: body.title,
    content: body.content,
    type: body.type || "message",
    should_vibrate: body.should_vibrate ?? false
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const db = supabaseAdmin();
  const { error } = await db.from(TABLE).update({ is_read: true }).eq("id", id);
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
