"use client";
import { CollapseSection } from "./ui";
import type { SheetCtx } from "./types";

export function ExtraTab({ ctx }: { ctx: SheetCtx }) {
  const { cd, clsData, raceData, bgData, updCd, save } = ctx;

  return (
    <div className="space-y-3">
      <CollapseSection title="Competenze" subtitle="Armature, armi, strumenti dalla classe e background.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">🛡️ Armature</p>
            <p className="text-sm text-white/80">{clsData ? clsData.armorProficiencies.join(", ") : "—"}</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">⚔️ Armi</p>
            <p className="text-sm text-white/80">{clsData ? clsData.weaponProficiencies.join(", ") : "—"}</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">🔧 Strumenti</p>
            <p className="text-sm text-white/80">{clsData && clsData.toolProficiencies.length > 0 ? clsData.toolProficiencies.join(", ") : "—"}</p>
          </div>
        </div>
        <textarea className="veil-input w-full min-h-[60px] text-sm mt-3"
          placeholder=""
          value={cd.otherProficiencies || ""}
          onChange={e => updCd("otherProficiencies", e.target.value)}
          onBlur={() => save({ otherProficiencies: ctx.formRef.current?.character_data?.otherProficiencies })} />
      </CollapseSection>

      <CollapseSection title="Caratteristiche dal Background" subtitle="Tratto del background e lingue conosciute.">
        {bgData && (
          <div className="mb-3">
            <p className="text-xs text-blue-400/70 font-medium">{bgData.feature.name}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{bgData.feature.description}</p>
          </div>
        )}
        {!bgData && <p className="text-[11px] text-white/30">Nessun background selezionato.</p>}

        <div className="mt-3 pt-3 border-t border-white/[0.05]">
          <h4 className="text-xs text-veil-gold/70 font-medium mb-2">Linguaggi</h4>
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
      </CollapseSection>
    </div>
  );
}
