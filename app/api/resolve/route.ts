import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const type = req.nextUrl.searchParams.get("type");
  const id = req.nextUrl.searchParams.get("id");

  if (!sessionId || !type || !id) {
    return NextResponse.json({ error: "sessionId, type e id richiesti" }, { status: 400 });
  }

  const db = supabaseAdmin();

  switch (type) {
    case "npc": {
      // Search by external_id (from campaign pack) or by name
      const { data, error } = await db
        .from("npcs")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},name.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    case "location": {
      const { data, error } = await db
        .from("locations")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},name.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    case "item":
    case "relic": {
      const { data, error } = await db
        .from("relics")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},name.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    case "faction": {
      const { data, error } = await db
        .from("factions")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},name.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    case "combat": {
      const { data, error } = await db
        .from("combat_encounters")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},title.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    case "music": {
      const { data, error } = await db
        .from("music_tracks")
        .select()
        .eq("session_id", sessionId)
        .or(`id.eq.${id},title.ilike.${id}`)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ item: data || null });
    }

    default:
      return NextResponse.json({ error: `Tipo sconosciuto: ${type}` }, { status: 400 });
  }
}