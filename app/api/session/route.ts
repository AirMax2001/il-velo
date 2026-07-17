import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseClient";

function validateDmPassword(dmPassword?: string) {
  const expectedPassword = process.env.DM_PASSWORD;
  if (!expectedPassword) return { ok: true };
  if (dmPassword !== expectedPassword) {
    return { ok: false, error: "Password DM errata", status: 401 as const };
  }
  return { ok: true };
}

function explainSessionError(message: string) {
  if (message.includes("Could not find the 'password_hash' column") || message.includes("password_hash")) {
    return "La colonna password_hash non è presente nel database. Esegui supabase/player_sheet_columns.sql o aggiungi la colonna players.password_hash nel database.";
  }
  return message;
}

// GET: recupera una sessione singola oppure tutte le campagne disponibili per l'admin DM
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const list = req.nextUrl.searchParams.get("list") === "1" || req.nextUrl.searchParams.get("mode") === "list";
    const db = supabaseAdmin();

    if (list) {
      const { data: sessions, error } = await db.from("sessions").select("id, name, code, created_at").order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ sessions: sessions || [] });
    }

    if (!id) return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    const { data: session, error } = await db.from("sessions").select("id, name, code").eq("id", id).single();
    if (error || !session) return NextResponse.json({ error: "Sessione non trovata" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nel caricamento della sessione" }, { status: 500 });
  }
}

// POST: crea sessione (DM) oppure crea player in una sessione esistente
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id richiesto" }, { status: 400 });

    const db = supabaseAdmin();
    const { error } = await db.from("sessions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nell'eliminazione della sessione" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = supabaseAdmin();

    if (body.action === "verify_dm") {
      const passwordCheck = validateDmPassword(body.dmPassword);
      if (!passwordCheck.ok) {
        return NextResponse.json({ error: passwordCheck.error }, { status: passwordCheck.status });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "create_session") {
      const passwordCheck = validateDmPassword(body.dmPassword);
      if (!passwordCheck.ok) {
        return NextResponse.json({ error: passwordCheck.error }, { status: passwordCheck.status });
      }

      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data, error } = await db
        .from("sessions")
        .insert({ code, name: body.name || "Nuova Campagna" })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await db.from("world_state").insert({ session_id: data.id });
      return NextResponse.json({ session: data });
    }

    if (body.action === "resume_session") {
      const passwordCheck = validateDmPassword(body.dmPassword);
      if (!passwordCheck.ok) {
        return NextResponse.json({ error: passwordCheck.error }, { status: passwordCheck.status });
      }

      let sessionQuery = db.from("sessions").select().order("created_at", { ascending: false });
      if (body.code) {
        sessionQuery = sessionQuery.eq("code", body.code?.toUpperCase());
      }

      const { data: session, error } = await sessionQuery.limit(1).maybeSingle();
      if (error || !session) {
        return NextResponse.json({ error: body.code ? "Codice campagna non trovato" : "Nessuna campagna disponibile" }, { status: 404 });
      }
      return NextResponse.json({ session, dm_access_token: crypto.randomUUID() });
    }

    if (body.action === "player_login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      if (!email || !password) return NextResponse.json({ error: "Email e password richieste" }, { status: 400 });

      const hashPassword = (value: string) => createHash("sha256").update(value).digest("hex");
      const { data: players, error: pErr } = await db
        .from("players")
        .select("*, sessions:session_id(id, name, code)")
        .eq("email", email)
        .limit(20);
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

      const matched = (players || []).find((p: any) => p.password_hash === hashPassword(password));
      if (!matched) return NextResponse.json({ error: "Email o password errati" }, { status: 401 });

      return NextResponse.json({ player: matched, session: matched.sessions });
    }

    if (body.action === "player_register") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      if (!email || !password) return NextResponse.json({ error: "Email e password richieste" }, { status: 400 });

      const hashPassword = (value: string) => createHash("sha256").update(value).digest("hex");

      const { data: existing } = await db.from("players").select("id").eq("email", email).maybeSingle();
      if (existing) return NextResponse.json({ error: "Email già registrata" }, { status: 409 });

      const token = crypto.randomUUID();
      const { data: player, error } = await db
        .from("players")
        .insert({ email, password_hash: hashPassword(password), access_token: token })
        .select()
        .single();
      if (error) return NextResponse.json({ error: explainSessionError(error.message) }, { status: 500 });
      return NextResponse.json({ player });
    }

    if (body.action === "join_session") {
      const characterName = String(body.characterName || "").trim();
      const password = String(body.password || "").trim();
      const confirmPassword = String(body.confirmPassword || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      const { data: session, error: sErr } = await db
        .from("sessions")
        .select()
        .eq("code", body.code?.toUpperCase())
        .single();
      if (sErr || !session)
        return NextResponse.json({ error: "Codice sessione non valido" }, { status: 404 });

      if (!characterName) {
        return NextResponse.json({ error: "Inserisci un nome personaggio valido" }, { status: 400 });
      }

      const { data: existingPlayer, error: existingErr } = await db
        .from("players")
        .select()
        .eq("session_id", session.id)
        .ilike("character_name", characterName)
        .maybeSingle();
      if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

      const hashPassword = (value: string) => createHash("sha256").update(value).digest("hex");

      if (existingPlayer) {
        if (!password) {
          return NextResponse.json({ error: "Nome già esistente: inserisci la password per accedere" }, { status: 400 });
        }

        if (!existingPlayer.password_hash) {
          return NextResponse.json({ error: "Questo personaggio è già registrato ma non ha una password impostata" }, { status: 400 });
        }

        if (existingPlayer.password_hash !== hashPassword(password)) {
          return NextResponse.json({ error: "Password errata per questo personaggio" }, { status: 401 });
        }

        return NextResponse.json({ player: existingPlayer, session });
      }

      if (!password || !confirmPassword) {
        return NextResponse.json({ error: "Inserisci password e conferma password per registrare" }, { status: 400 });
      }

      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Le password non corrispondono" }, { status: 400 });
      }

      const token = crypto.randomUUID();
      const insertData: any = {
        session_id: session.id,
        character_name: characterName,
        access_token: token,
        password_hash: hashPassword(password)
      };
      if (email) insertData.email = email;

      const { data: player, error } = await db
        .from("players")
        .insert(insertData)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: explainSessionError(error.message) }, { status: 500 });
      }
      return NextResponse.json({ player, session });
    }

    return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Errore nella gestione della sessione" }, { status: 500 });
  }
}
