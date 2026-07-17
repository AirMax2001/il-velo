import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const trigger = req.nextUrl.searchParams.get("trigger");
  const db = supabaseAdmin();
  let query = db.from("dm_tutorial").select().order("sort_order", { ascending: true });
  if (trigger) query = query.eq("trigger_event", trigger);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
