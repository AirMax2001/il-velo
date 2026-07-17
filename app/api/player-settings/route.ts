import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const { id, ...fields } = body;
  const allowedFields = ["personality", "history", "objectives", "notes", "appearance", "roleplay_notes"];
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([key]) => allowedFields.includes(key))
  );
  const { data, error } = await db.from("players").update(cleanFields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data });
}
