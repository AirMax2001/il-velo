import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const db = supabaseAdmin();
  
  let { data, error } = await db
    .from("battlemap_state")
    .select()
    .eq("session_id", sessionId)
    .maybeSingle();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Se non esiste, crea uno stato di default
  if (!data) {
    const { data: inserted, error: insertError } = await db
      .from("battlemap_state")
      .insert({
        session_id: sessionId,
        background_type: "stone",
        grid_width: 20,
        grid_height: 15,
        walls: [],
        tokens: []
      })
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json({ 
        error: "Errore inizializzazione griglia. Verifica di aver eseguito lo script SQL: " + insertError.message 
      }, { status: 500 });
    }
    data = inserted;
  }
  
  return NextResponse.json({ battlemap: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, ...fields } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  const db = supabaseAdmin();
  
  fields.updated_at = new Date().toISOString();
  
  const { data, error } = await db
    .from("battlemap_state")
    .upsert({
      session_id: sessionId,
      ...fields
    })
    .select()
    .single();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ battlemap: data });
}
