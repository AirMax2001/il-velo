"use client";
import { ALIGNMENTS } from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step0Info({ ctx }: { ctx: WizardCtx }) {
  const { data, update } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Informazioni Base</h2>
        <p className="text-sm text-white/50 mt-1">Il nome e l'aspetto del tuo personaggio. Puoi modificarli anche dopo nella scheda.</p>
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1 block">Nome del Personaggio *</label>
        <input className="veil-input w-full" value={data.name}
          onChange={e => update("name", e.target.value)} placeholder="Es. Eldrin, Thorin, Lyra..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Allineamento</label>
          <select className="veil-input w-full" value={data.alignment} onChange={e => update("alignment", e.target.value)}>
            {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <p className="text-[10px] text-white/25 mt-1">L'allineamento descrive la morale e la personalità del personaggio.</p>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Sesso</label>
          <input className="veil-input w-full" value={data.sex}
            onChange={e => update("sex", e.target.value)} placeholder="Maschio / Femmina / Altro" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Età</label>
          <input className="veil-input w-full" value={data.age}
            onChange={e => update("age", e.target.value)} placeholder="Es. 25" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Divinità (opzionale)</label>
          <input className="veil-input w-full" value={data.deity}
            onChange={e => update("deity", e.target.value)} placeholder="Es. Torm, Mystra, nessuna" />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/40 mb-1 block">Descrizione Fisica</label>
        <textarea className="veil-input w-full min-h-[60px]" value={data.appearance}
          onChange={e => update("appearance", e.target.value)}
          placeholder="Alto, capelli scuri, cicatrice sulla guancia, occhi verdi..." />
      </div>
    </div>
  );
}