import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId richiesto" }, { status: 400 });
  const db = supabaseAdmin();

  const { data: state } = await db.from("world_state").select().eq("session_id", sessionId).single();
  const { data: location } = state?.current_location_id
    ? await db.from("locations").select().eq("id", state.current_location_id).single()
    : { data: null };
  const { data: event } = state?.current_event_id
    ? await db.from("events").select().eq("id", state.current_event_id).single()
    : { data: null };
  const { data: anomalies } = await db
    .from("veil_anomalies")
    .select()
    .eq("session_id", sessionId)
    .eq("active", true);

  return NextResponse.json({ state, location, event, anomalies: anomalies || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();
  const fields: Record<string, any> = { updated_at: new Date().toISOString() };
  if ("locationId" in body) fields.current_location_id = body.locationId;
  if ("eventId" in body) fields.current_event_id = body.eventId;
  if ("stability" in body) fields.stability = body.stability;
  if ("instabilityMeter" in body) fields.instability_meter = body.instabilityMeter;
  if ("weather" in body) fields.weather = body.weather;
  if ("campaignPhase" in body) fields.campaign_phase = body.campaignPhase;
  if ("veilLevel" in body) fields.veil_level = body.veilLevel;
  if ("permanentDecisions" in body) fields.permanent_decisions = body.permanentDecisions;
  if ("time" in body) fields.time = body.time;

  const { error } = await db.from("world_state").update(fields).eq("session_id", body.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
