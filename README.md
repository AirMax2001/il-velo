# THE VEIL

Motore narrativo per campagne D&D custom: pannello DM, interfaccia giocatore (Echo Messages), display da tavolo (iPad).

Stack: **Next.js 14** (App Router) + **Supabase** (Postgres gratuito, hosting DB) + **Vercel** (hosting web, gratuito).

---

## 1. Come funzionano i salvataggi / il database

Tutti i dati (sessioni, giocatori, NPC, location, eventi, segreti, messaggi Echo, stato del mondo) vivono su **Supabase**, un Postgres gestito con piano gratuito generoso (500MB DB, sempre attivo su progetti free ma con pausa dopo inattività prolungata — si risveglia alla prima richiesta).

Non c'è nessun salvataggio "locale": tutto passa dalle API route di Next.js (`app/api/...`), che usano la **service role key** di Supabase lato server (mai esposta al browser). Il browser non parla mai direttamente al DB con permessi di scrittura.

Tabelle principali (vedi `supabase/schema.sql`):
- `sessions` — una campagna = una sessione con codice univoco (es. `X7K2PQ`) che il DM condivide coi giocatori.
- `players` — personaggi collegati a una sessione, con `access_token` personale (è il link che usa il giocatore, niente password da ricordare).
- `npcs`, `locations`, `events` — contenuti narrativi creati dal DM.
- `secrets` — verità nascoste legate a un player specifico.
- `echo_messages` — i messaggi del Velo: se `player_id` è vuoto sono broadcast a tutti, altrimenti privati per quel giocatore.
- `world_state` — un solo record per sessione: location/evento "attivi" mostrati sul Table Display.

### Backup
Supabase fa backup automatici (7 giorni sul piano free). Per un backup manuale:
```
Dashboard Supabase → Database → Backups → Download
```
oppure via `pg_dump` con la connection string del progetto.

### Reset di una campagna
Basta cancellare la riga in `sessions`: le foreign key `on delete cascade` eliminano automaticamente tutti i dati collegati (players, npcs, locations, events, secrets, echo_messages, world_state).

---

## 2. Setup da zero (tutto gratuito)

### A. Crea il progetto Supabase
1. Vai su https://supabase.com → crea un account gratuito → "New Project".
2. Una volta pronto, vai su **SQL Editor** → incolla il contenuto di `supabase/schema.sql` → Run.
3. Vai su **Project Settings → API**: copia `Project URL`, `anon public key`, `service_role key`.

### B. Configura le variabili d'ambiente
Copia `.env.example` in `.env.local` e riempi:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DM_PASSWORD=scegli-una-password-per-il-DM
```

### C. Avvio in locale (opzionale, per test)
```
npm install
npm run dev
```
App su http://localhost:3000

---

## 3. Deploy online gratuito su Vercel con dominio

1. Crea un account gratuito su https://vercel.com (puoi collegarlo a GitHub).
2. Metti questo progetto in un repository GitHub (crea un repo vuoto e fai push di questi file).
3. Su Vercel: **Add New → Project** → seleziona il repository.
4. In **Environment Variables** inserisci le stesse 4 variabili di `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DM_PASSWORD).
5. Deploy. Vercel ti dà già gratis un dominio tipo `the-veil.vercel.app`.

### Dominio personalizzato
- Se hai già un dominio (es. comprato su Namecheap/Cloudflare): Vercel → Project → **Settings → Domains** → aggiungi il tuo dominio → segui le istruzioni per i record DNS (CNAME/A) da impostare dal tuo provider.
- Se non hai un dominio: puoi usare gratis il sottodominio `xxx.vercel.app`, oppure registrarne uno a basso costo (i domini a pagamento non sono coperti dal piano gratuito di Vercel, che offre solo l'hosting).

Da questo momento ogni `git push` sul branch principale aggiorna automaticamente il sito online.

---

## 4. Struttura del progetto

```
app/
  page.tsx              → home / login (DM, Player, Table)
  dm/page.tsx            → pannello di controllo DM
  player/[code]/page.tsx → interfaccia giocatore (Echo Messages)
  table/page.tsx         → display ambientale da tavolo
  api/session/           → creazione sessione + join giocatore
  api/state/             → stato del mondo (location/evento attivo)
  api/locations/         → CRUD location
  api/events/            → CRUD eventi
  api/npcs/              → CRUD NPC
  api/secrets/           → CRUD segreti dei personaggi
  api/echo/              → invio/lettura Echo Messages
lib/supabaseClient.ts    → client Supabase (pubblico + admin)
supabase/schema.sql      → schema completo del database
```

## 5. Funzionalità V1 (versione attuale)

- **World Control**: stato del mondo (stable/unstable/broken) + instability meter + Veil Anomalies attivabili/disattivabili.
- **Party Management**: scheda completa per personaggio (razza, classe, background, obiettivi, paura) + note DM private.
- **NPC System**: comportamento (passivo/attivo/glitch), stato memoria (stabile/corrotta), trigger narrativi.
- **Scene Control**: scene con atmosfera (calmo/disturbato/glitch) e attivazione live sul Table Display; eventi con trigger manuale/automatico.
- **Echo System**: invio broadcast o a singolo giocatore + log di chi ha ricevuto/letto cosa.
- **DM Notes**: area privata per brainstorming, mai visibile ai giocatori.
- **Player Interface**: scheda personaggio editabile, inventario/reliquie, diario (quest/memory/fragment), chat di roleplay tra giocatori.
- **Table Display**: scena con effetti visivi legati ad atmosfera/instabilità (flicker, glitch, overlay), mappa stilizzata SVG, anomalie attive in evidenza.
- **Realtime**: Echo Messages, chat roleplay e stato del mondo si aggiornano da soli via Supabase Realtime (niente refresh manuale).

⚠️ Nota di sicurezza: per abilitare Supabase Realtime alcune tabelle (`echo_messages`, `roleplay_messages`, `world_state`, `locations`, `veil_anomalies`, `inventory_items`, `memory_entries`) hanno una policy di lettura pubblica basata sulla segretezza degli UUID nell'URL, non su un vero controllo di identità. È adeguato per una campagna privata giocata con amici fidati; per un uso più esposto pubblicamente, andrebbe sostituita con Supabase Auth reale.

## 6. Roadmap di versioning (per espansioni future)

Il DB è già pensato per supportarle senza migrazioni distruttive:

- **V2 — Combat System**: la tabella `players` ha già `level`, `hp_current`, `hp_max`. Da aggiungere: iniziativa, tiri danno, tabella `enemies`/`combat_encounters`.
- **V3 — Veil System avanzato**: `veil_anomalies` e `world_state.instability_meter` sono già la base; da espandere con progressione automatica delle anomalie e conseguenze narrative legate alla soglia di instabilità.

## 7. Prossimi passi consigliati
- Aggiungere upload immagini (Supabase Storage, gratuito fino a 1GB) per relic/visioni/mappe/NPC.
- Sostituire le policy "public read" con Supabase Auth reale per una sicurezza più solida.
- Aggiungere autenticazione DM più robusta (oggi è una singola password condivisa via env var).
