import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const db = supabaseAdmin();
  let query = db.from("rule_assistant").select().order("sort_order", { ascending: true });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
