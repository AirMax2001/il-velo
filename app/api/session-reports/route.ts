import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const TABLE = "session_reports";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const db = supabaseAdmin();
  const { data, error } = await db.from(TABLE).select().eq("session_id", sessionId).order("session_number", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db.from(TABLE).insert({
    session_id: body.session_id,
    session_number: body.session_number,
    title: body.title,
    summary: body.summary || "",
    player_decisions: body.player_decisions || [],
    killed_npcs: body.killed_npcs || [],
    new_npcs: body.new_npcs || [],
    loot: body.loot || [],
    found_relics: body.found_relics || [],
    story_changes: body.story_changes || [],
    campaign_changes: body.campaign_changes || [],
    dm_notes: body.dm_notes || ""
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const db = supabaseAdmin();
  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
