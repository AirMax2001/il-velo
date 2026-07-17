import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const playerId = req.nextUrl.searchParams.get("playerId");
  const db = supabaseAdmin();

  let query = db
    .from("echo_messages")
    .select()
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (playerId) query = query.or(`player_id.eq.${playerId},player_id.is.null`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const payload: Record<string, any> = {
    session_id: body.sessionId,
    player_id: body.playerId ?? null,
    content: body.content,
    type: body.type ?? "vision",
    image_url: body.imageUrl ?? null,
    delivery_mode: body.deliveryMode ?? "vision",
    should_vibrate: Boolean(body.shouldVibrate),
    visible_to_player_ids: body.visibleToPlayerIds ?? []
  };

  const { data, error } = await db.from("echo_messages").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { error } = await db
    .from("echo_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
