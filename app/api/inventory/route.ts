import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

const TABLE = "inventory_items";

/* Colonne disponibili nella tabella: lette una volta e cachate.
   Così l'API funziona anche se non sono state applicate tutte le migrazioni
   (es. `value` di supabase/inventory_value.sql): i campi mancanti vengono ignorati. */
let columnsCache: string[] | null = null;
async function getColumns(): Promise<string[]> {
  if (columnsCache) return columnsCache;
  const { data } = await supabaseAdmin()
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_name", TABLE);
  columnsCache = (data || []).map((c: any) => c.column_name);
  return columnsCache;
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const playerId = req.nextUrl.searchParams.get("playerId");
  const view = req.nextUrl.searchParams.get("view");
  const db = supabaseAdmin();

  const base = () => db.from(TABLE).select().eq("session_id", sessionId).order("created_at", { ascending: false });

  if (view === "dm") {
    let q = base();
    if (playerId) q = q.eq("player_id", playerId);
    const { data, error } = await q;
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
  const cols = await getColumns();

  const row: Record<string, any> = {
    session_id: body.session_id,
    player_id: body.player_id || null,
    name: body.name,
    description: body.description || "",
    rarity: body.rarity || "common",
    category: body.category || "general",
    item_type: body.item_type || body.type || "other",
    is_relic: body.rarity === "relic" || body.is_relic || false,
  };
  const optional: Record<string, any> = {
    weight: body.weight ?? 0,
    value: body.value ?? 0,
    quantity: body.quantity ?? 1,
    hidden: false,
  };
  for (const [k, v] of Object.entries(optional)) {
    if (cols.includes(k)) row[k] = v;
  }

  const { data, error } = await db.from(TABLE).insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { id, ...fields } = body;
  const cols = await getColumns();
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (cols.includes(k)) clean[k] = v;
  }
  const { error } = await db.from(TABLE).update(clean).eq("id", id);
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
