"use client";
import { getFeaturesAtLevel } from "@/lib/data/leveling";
import type { SheetCtx } from "./types";

export function ExtraTab({ ctx }: { ctx: SheetCtx }) {
  const { cd, clsKey, clsData, raceData, bgData, level, updCd, save } = ctx;

  return (
    <div className="space-y-4">
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Linguaggi</h3>
        <p className="text-[10px] text-white/30 mb-1">
          {raceData ? `Lingua/e dalla razza: ${raceData.languages.join(", ")}` : ""}
          {bgData?.languages ? ` · ${bgData.languages} extra dal background` : ""}
        </p>
        <textarea className="veil-input w-full min-h-[60px] text-sm"
          placeholder="Comune, Nanico, Elfico..."
          value={cd.languages || raceData?.languages.join(", ") || ""}
          onChange={e => updCd("languages", e.target.value)}
          onBlur={() => save({ languages: ctx.formRef.current?.character_data?.languages })} />
      </div>

      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Competenze</h3>
        <p className="text-[10px] text-white/30 mb-1">Armature, armi, strumenti dalla classe e background.</p>
        {clsData && (
          <div className="rounded-lg bg-black/20 p-2 mb-2 text-[10px] text-white/35 space-y-0.5">
            {clsData.armorProficiencies.length > 0 && <p>🛡️ Armature: {clsData.armorProficiencies.join(", ")}</p>}
            <p>⚔️ Armi: {clsData.weaponProficiencies.join(", ")}</p>
            {clsData.toolProficiencies.length > 0 && <p>🔧 Strumenti: {clsData.toolProficiencies.join(", ")}</p>}
          </div>
        )}
        <textarea className="veil-input w-full min-h-[60px] text-sm"
          placeholder="Armi semplici, Armature leggere, Strumenti da musicista..."
          value={cd.otherProficiencies || ""}
          onChange={e => updCd("otherProficiencies", e.target.value)}
          onBlur={() => save({ otherProficiencies: ctx.formRef.current?.character_data?.otherProficiencies })} />
      </div>

      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Caratteristiche di Classe</h3>
        {Array.from({ length: level }, (_, i) => i + 1).map(lv => {
          const feats = getFeaturesAtLevel(clsKey || "", lv);
          if (feats.length === 0) return null;
          return (
            <div key={lv} className="mb-3">
              <p className="text-xs text-white/30 mb-1">Livello {lv}</p>
              {feats.map(f => (
                <div key={f.name} className="mb-2">
                  <p className="text-xs text-veil-gold/70 font-medium">✦ {f.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{f.description}</p>
                </div>
              ))}
            </div>
          );
        })}
        {raceData?.traits.map(t => (
          <div key={t.name} className="mb-3">
            <p className="text-xs text-emerald-400/70 font-medium">{t.name} <span className="text-[9px] text-white/20">(razza)</span></p>
            <p className="text-[11px] text-white/40 mt-0.5">{t.description}</p>
          </div>
        ))}
        {bgData && (
          <div className="mb-3">
            <p className="text-xs text-blue-400/70 font-medium">{bgData.feature.name} <span className="text-[9px] text-white/20">(background)</span></p>
            <p className="text-[11px] text-white/40 mt-0.5">{bgData.feature.description}</p>
          </div>
        )}
      </div>

      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Note Aggiuntive</h3>
        <textarea className="veil-input w-full min-h-[80px] text-sm"
          placeholder="Note varie, ricompense, missioni, ecc..."
          value={(cd as any).notes || ""}
          onChange={e => updCd("notes", e.target.value)}
          onBlur={() => save({ notes: (ctx.formRef.current?.character_data as any)?.notes })} />
      </div>
    </div>
  );
}