import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const db = supabaseAdmin();
    const { data: session, error } = await db
      .from("sessions")
      .select("id, name, code")
      .eq("code", code?.toUpperCase())
      .single();
    if (error || !session) return NextResponse.json({ error: "Codice campagna non trovato" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nel recupero della campagna" }, { status: 500 });
  }
}
