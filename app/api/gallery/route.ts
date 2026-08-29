import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const packId = req.nextUrl.searchParams.get("sessionPackId");
  if (!sessionId) return NextResponse.json({ error: "sessionId richiesto" }, { status: 400 });
  const db = supabaseAdmin();
  let q = db.from("session_gallery").select("*, session_packs(title, session_number)").eq("session_id", sessionId).order("created_at", { ascending: false });
  if (packId) q = q.eq("session_pack_id", packId);
  const { data, error } = await q;
  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
      return NextResponse.json({ items: [], _missingTable: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const items = (data || []).map((row: any) => ({
    id: row.id,
    session_id: row.session_id,
    session_pack_id: row.session_pack_id,
    image_url: row.image_url,
    caption: row.caption,
    created_at: row.created_at,
    session_packs: row.session_packs || null,
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id, session_pack_id, image_url, caption } = body;
  if (!session_id || !image_url) return NextResponse.json({ error: "session_id e image_url richiesti" }, { status: 400 });
  const db = supabaseAdmin();
  const { data, error } = await db.from("session_gallery").insert({
    session_id,
    session_pack_id: session_pack_id || null,
    image_url,
    caption: caption || null,
  }).select("*, session_packs(title, session_number)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: {
    id: data.id,
    session_id: data.session_id,
    session_pack_id: data.session_pack_id,
    image_url: data.image_url,
    caption: data.caption,
    created_at: data.created_at,
    session_packs: (data as any).session_packs || null,
  }});
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id richiesto" }, { status: 400 });
  const db = supabaseAdmin();
  const { error } = await db.from("session_gallery").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
