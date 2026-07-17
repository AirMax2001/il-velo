import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// GET: lista giocatori di una sessione (DM Party Management) o un singolo player per token
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const token = req.nextUrl.searchParams.get("token");
    const db = supabaseAdmin();

    if (token) {
      const { data, error } = await db.from("players").select().eq("access_token", token).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 404 });
      await db.from("players").update({ last_access: new Date().toISOString() }).eq("id", data.id);
      return NextResponse.json({ player: { ...data, last_access: new Date().toISOString() } });
    }

    const { data, error } = await db.from("players").select().eq("session_id", sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ players: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nel caricamento dei giocatori" }, { status: 500 });
  }
}

// PATCH: aggiorna la scheda personaggio (usato sia dal player per la propria sheet
// sia dal DM per le note private — la separazione dei campi è gestita lato UI)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const db = supabaseAdmin();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "ID giocatore mancante" }, { status: 400 });
    }

    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    );

    const { data, error } = await db
      .from("players")
      .update(cleanFields)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: explainPlayerError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, player: data });
  } catch (error: any) {
    return NextResponse.json({ error: explainPlayerError(error.message || "Errore nel salvataggio della scheda") }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nell'eliminazione" }, { status: 500 });
  }
}

function explainPlayerError(message: string) {
  if (message.includes("schema cache") || message.includes("Could not find")) {
    return "Il database Supabase non ha ancora tutte le colonne della scheda giocatore. Esegui supabase/player_sheet_columns.sql nel SQL Editor di Supabase.";
  }

  return message;
}
