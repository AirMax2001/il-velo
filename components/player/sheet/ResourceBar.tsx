"use client";
import { getClassResources } from "@/lib/data/classAbilities";
import type { CharacterData } from "@/lib/types";

type Props = {
  clsKey: string | null;
  level: number;
  pb: number;
  cd: CharacterData;
  updCdAll: (obj: Record<string, any>) => void;
  save: (fields: Record<string, any>) => void;
  compact?: boolean;
};

/* Bubble delle risorse di classe (Ki, Ira, Punti Stregoneria, Incanalare
   Divinità, ecc.). Il totale è SEMPRE ricalcolato da CLASS_RESOURCES in base
   a livello/caratteristiche/pb — non va mai letto da un valore salvato,
   così resta corretto anche se il level-up non lo "spinge" esplicitamente. */
export function ResourceBar({ clsKey, level, pb, cd, updCdAll, save, compact }: Props) {
  const resources = clsKey ? getClassResources(clsKey) : [];
  if (resources.length === 0) return null;
  const spent = (cd.resources || {}) as Record<string, { total?: number; expended?: number }>;

  function adjust(key: string, total: number, i: number, available: number) {
    const cur = spent[key]?.expended ?? 0;
    const newVal = i < available ? cur + 1 : Math.min(cur, i);
    const next = { ...spent, [key]: { total, expended: Math.max(0, Math.min(total, newVal)) } };
    updCdAll({ resources: next });
    save({ resources: next });
  }
  function rest(key: string, total: number) {
    const next = { ...spent, [key]: { total, expended: 0 } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  return (
    <div className={compact ? "flex flex-wrap items-center gap-x-4 gap-y-1.5" : "flex flex-wrap justify-center gap-4"}>
      {resources.map(r => {
        const total = r.max(level, cd, pb);
        const used = spent[r.key]?.expended ?? 0;
        const available = Math.max(0, total - used);
        return (
          <div key={r.key} className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-sm leading-none" title={r.name}>{r.icon}</span>
            {!compact && <span className="text-[10px] text-white/50 mr-1">{r.name}</span>}
            <button type="button" onClick={() => { const cur = spent[r.key]?.expended ?? 0; const nv = Math.min(total, cur + 1); const next = { ...spent, [r.key]: { total, expended: nv } }; updCdAll({ resources: next }); save({ resources: next }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Spendi (− toglie un pallino)">−</button>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(total, 20) }, (_, i) => (
                <button key={i} type="button"
                  onClick={() => adjust(r.key, total, i, available)}
                  title={i < available ? `${r.name}: disponibile (clicca per usare)` : `${r.name}: usato`}
                  className={`rounded-full border transition ${compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} ${i < available ? r.color : "bg-white/[0.04] border-white/10"}`} />
              ))}
            </div>
            <button type="button" onClick={() => { const cur = spent[r.key]?.expended ?? 0; const nv = Math.max(0, cur - 1); const next = { ...spent, [r.key]: { total, expended: nv } }; updCdAll({ resources: next }); save({ resources: next }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Recupera (+ aggiunge un pallino)">+</button>
            <span className="text-[9px] text-white/40">{available}/{total}</span>
            <button type="button" onClick={() => rest(r.key, total)}
              className="text-[9px] text-emerald-300/70 hover:underline">riposo</button>
          </div>
        );
      })}
    </div>
  );
}
