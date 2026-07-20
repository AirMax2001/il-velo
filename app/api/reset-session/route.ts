import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId richiesto" }, { status: 400 });

  const db = supabaseAdmin();

  // Delete in dependency order (cascading FKs handle child tables automatically)
  await db.from("combat_encounters").delete().eq("session_id", sessionId);
  await db.from("scene_tree").delete().eq("session_id", sessionId);
  await db.from("session_packs").delete().eq("session_id", sessionId);
  await db.from("campaign_packs").delete().eq("session_id", sessionId);
  await db.from("factions").delete().eq("session_id", sessionId);
  await db.from("npcs").delete().eq("session_id", sessionId);
  await db.from("quests").delete().eq("session_id", sessionId);
  await db.from("relics").delete().eq("session_id", sessionId);
  await db.from("clues").delete().eq("session_id", sessionId);
  await db.from("timeline_events").delete().eq("session_id", sessionId);
  await db.from("entity_links").delete().eq("session_id", sessionId);
  await db.from("campaign_metrics").delete().eq("session_id", sessionId);
  await db.from("campaign_status_config").delete().eq("session_id", sessionId);
  await db.from("notifications").delete().eq("session_id", sessionId);
  await db.from("session_reports").delete().eq("session_id", sessionId);

  return NextResponse.json({ ok: true });
}
