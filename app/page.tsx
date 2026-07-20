"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "choose" | "dm" | "player" | "table";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("choose");
  const [dmPassword, setDmPassword] = useState("");
  const [tablePassword, setTablePassword] = useState("");
  const [error, setError] = useState("");

  // Player auth state
  const [campaignCode, setCampaignCode] = useState("");
  const [playerStep, setPlayerStep] = useState<"code" | "character">("code");
  const [charName, setCharName] = useState("");
  const [charPassword, setCharPassword] = useState("");

  useEffect(() => {
    const storedCode = localStorage.getItem("veil_player_code");
    if (storedCode) {
      setCampaignCode(storedCode);
      setPlayerStep("character");
    }
    const storedName = localStorage.getItem("veil_player_name");
    if (storedName) setCharName(storedName);
    const storedPass = localStorage.getItem("veil_player_pass");
    if (storedPass) setCharPassword(storedPass);
  }, []);

  // Auto-save player join fields on change
  useEffect(() => { localStorage.setItem("veil_player_name", charName); }, [charName]);
  useEffect(() => { localStorage.setItem("veil_player_pass", charPassword); }, [charPassword]);

  async function readApiResponse(res: Response) {
    const text = await res.text();
    if (!text) return { error: "Nessuna risposta dal server." };
    try { return JSON.parse(text); }
    catch { return { error: "Risposta non valida." }; }
  }

  // ---------- DM LOGIN ----------
  async function loginDM() {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "verify_dm", dmPassword })
    });
    if (res.ok) {
      localStorage.setItem("veil_dm_authenticated", "true");
      router.push("/dm");
    } else {
      const data = await readApiResponse(res);
      setError(data.error || "Password errata");
    }
  }

  // ---------- TABLE LOGIN ----------
  async function loginTable() {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "verify_dm", dmPassword: tablePassword })
    });
    if (res.ok) {
      const listRes = await fetch("/api/session?list=1");
      const listData = await listRes.json();
      const sessions = listData.sessions || [];
      if (sessions.length > 0) {
        router.push(`/table?sessionId=${sessions[0].id}`);
      } else {
        setError("Nessuna campagna attiva");
      }
    } else {
      setError("Password errata");
    }
  }

  // ---------- PLAYER LOGIN (character name + password) ----------
  async function setCodeAndContinue() {
    setError("");
    if (!campaignCode.trim()) return setError("Inserisci il codice campagna");
    // Verify code exists
    const res = await fetch(`/api/session/lookup?code=${campaignCode.toUpperCase()}`);
    const data = await readApiResponse(res);
    if (data.error) return setError(data.error);
    localStorage.setItem("veil_player_code", campaignCode.toUpperCase());
    setPlayerStep("character");
  }

  async function loginOrJoin() {
    setError("");
    if (!charName.trim()) return setError("Inserisci il nome del personaggio");

    const code = localStorage.getItem("veil_player_code") || campaignCode;
    if (!code) return setError("Codice campagna mancante");

    const res = await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({
        action: "join_session",
        code,
        characterName: charName,
        password: charPassword,
        confirmPassword: charPassword
      })
    });
    const data = await readApiResponse(res);
    if (data.error) return setError(data.error);

    localStorage.removeItem("veil_player_name");
    localStorage.removeItem("veil_player_pass");
    const playerData = { ...data.player, session_id: data.session.id };
    localStorage.setItem("veil_player", JSON.stringify(playerData));
    router.push(`/player/${data.player.access_token}?sessionId=${data.session.id}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Decorative background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(140,92,30,0.12),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.4),transparent_60%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-4 py-8 sm:px-6">
        <section className="veil-panel w-full p-8 md:p-10">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">Piattaforma di gioco di ruolo</p>
            <h1 className="mt-4 text-4xl font-light tracking-[0.3em] text-veil-gold sm:text-5xl">Il Velo</h1>
            <div className="mx-auto mt-3 h-px w-12 bg-veil-gold/30" />
            <p className="mt-4 text-sm leading-relaxed text-white/40">
              Prepara la scena. Guida la storia. Fai vivere ogni sessione.
            </p>
          </div>

          <div className="veil-divider my-8" />
          {role === "choose" && (
            <div className="flex flex-col gap-3">
              <ActionCard title="Dungeon Master" description="Gestisci campagna, scene e party." onClick={() => setRole("dm")} />
              <ActionCard title="Giocatore" description="Entra nel Velo con il tuo personaggio." onClick={() => setRole("player")} />
              <ActionCard title="Tavolo" description="Display scenico per iPad o schermo esterno." onClick={() => setRole("table")} />
            </div>
          )}

          {role === "dm" && (
            <div className="flex flex-col gap-3">
              <input className="veil-input" type="password" placeholder="Password DM" value={dmPassword} onChange={e => setDmPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginDM()} autoFocus />
              <button className="veil-btn" onClick={loginDM}>Accedi come DM</button>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button className="mt-2 text-xs text-white/30 hover:text-white/60 transition" onClick={() => { setRole("choose"); setError(""); }}>← indietro</button>
            </div>
          )}

          {role === "player" && (
            <div className="flex flex-col gap-3">
              {playerStep === "code" && (
                <>
                  <input className="veil-input" placeholder="Codice campagna (es. X7K2PQ)" value={campaignCode} onChange={e => setCampaignCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && setCodeAndContinue()} autoFocus />
                  <button className="veil-btn" onClick={setCodeAndContinue}>Continua</button>
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  <button className="mt-2 text-xs text-white/30 hover:text-white/60 transition" onClick={() => { setRole("choose"); setError(""); }}>← indietro</button>
                </>
              )}

              {playerStep === "character" && (
                <>
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Campagna</p>
                    <p className="mt-1 text-sm text-veil-gold/90">{campaignCode || localStorage.getItem("veil_player_code")}</p>
                  </div>
                  <input className="veil-input" placeholder="Nome del personaggio" value={charName} onChange={e => setCharName(e.target.value)} autoFocus />
                  <input className="veil-input" type="password" placeholder="Password" value={charPassword} onChange={e => setCharPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginOrJoin()} />
                  <button className="veil-btn" onClick={loginOrJoin}>Accedi / Registrati</button>
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  <button className="mt-2 text-xs text-white/30 hover:text-white/60 transition" onClick={() => { setPlayerStep("code"); setError(""); localStorage.removeItem("veil_player_code"); setCampaignCode(""); }}>← cambia codice</button>
                </>
              )}
            </div>
          )}

          {role === "table" && (
            <div className="flex flex-col gap-3">
              <input className="veil-input" type="password" placeholder="Password DM" value={tablePassword} onChange={e => setTablePassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginTable()} autoFocus />
              <button className="veil-btn" onClick={loginTable}>Apri Display Tavolo</button>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button className="mt-2 text-xs text-white/30 hover:text-white/60 transition" onClick={() => { setRole("choose"); setError(""); }}>← indietro</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ActionCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 px-5 py-4 text-left transition hover:border-veil-gold/25 hover:bg-veil-gold/[0.04]">
      <div>
        <p className="text-sm font-semibold text-white group-hover:text-veil-gold/90 transition-colors">{title}</p>
        <p className="mt-0.5 text-sm text-white/50">{description}</p>
      </div>
      <span className="text-base text-veil-gold/40 group-hover:text-veil-gold/80 transition-colors">→</span>
    </button>
  );
}
