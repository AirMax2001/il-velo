"use client";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { SuggestField, CollapseSection } from "./ui";
import type { SheetCtx } from "./types";

export function PersonalityTab({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, bgData, upd, updCd, save } = ctx;
  const bgTraits = bgData?.personalityTraits || [];
  const bgIdeals = bgData?.ideals || [];
  const bgBonds = bgData?.bonds || [];
  const bgFlaws = bgData?.flaws || [];

  return (
    <CollapseSection title="Personaggio" subtitle="Tratti, storia, motivazioni e aspetto fisico.">
    <div className="space-y-4">
      <div className="veil-panel p-4 space-y-4">
        <h3 className="text-sm text-veil-gold/80 font-medium">
          Tratti {bgData && <span className="text-[10px] text-white/30 font-normal ml-1">Background: {bgData.name}</span>}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SuggestField label="Tratti di Personalità" fieldKey="personalityTraits" value={cd.personalityTraits || ""} suggestions={bgTraits}
            onChange={v => updCd("personalityTraits", v)} onPick={v => save({ personalityTraits: v })}
            onBlur={() => save({ personalityTraits: ctx.formRef.current?.character_data?.personalityTraits })} />
          <SuggestField label="Ideali" fieldKey="ideals" value={cd.ideals || ""} suggestions={bgIdeals}
            onChange={v => updCd("ideals", v)} onPick={v => save({ ideals: v })}
            onBlur={() => save({ ideals: ctx.formRef.current?.character_data?.ideals })} />
          <SuggestField label="Legami" fieldKey="bonds" value={cd.bonds || ""} suggestions={bgBonds} isTop
            onChange={v => updCd("bonds", v)} onPick={v => save({ bonds: v })}
            onBlur={() => save({ bonds: ctx.formRef.current?.character_data?.bonds })} />
          <SuggestField label="Difetti" fieldKey="flaws" value={cd.flaws || ""} suggestions={bgFlaws} isTop
            onChange={v => updCd("flaws", v)} onPick={v => save({ flaws: v })}
            onBlur={() => save({ flaws: ctx.formRef.current?.character_data?.flaws })} />
        </div>
      </div>

      <div className="veil-panel p-4 space-y-4">
        <h3 className="text-sm text-veil-gold/80 font-medium">Storia e Motivazioni</h3>
        <div>
          <LabelWithGuide fieldKey="history" label="Storia del Personaggio" />
          <textarea className="veil-input mt-1 w-full min-h-[80px] text-sm"
            value={form?.history || ""}
            onChange={e => upd("history", e.target.value)}
            onBlur={() => save({ history: ctx.formRef.current?.history })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <LabelWithGuide fieldKey="goals" label="Obiettivo" />
            <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
              value={form?.goals || ""}
              onChange={e => upd("goals", e.target.value)}
              onBlur={() => save({ goals: ctx.formRef.current?.goals })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="fear" label="Paura" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={form?.fear || ""}
              onChange={e => upd("fear", e.target.value)}
              onBlur={() => save({ fear: ctx.formRef.current?.fear })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="important_person" label="Persona Importante" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={form?.important_person || ""}
              onChange={e => upd("important_person", e.target.value)}
              onBlur={() => save({ important_person: ctx.formRef.current?.important_person })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="secret" label="Segreto" />
            <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
              value={form?.secret || ""}
              onChange={e => upd("secret", e.target.value)}
              onBlur={() => save({ secret: ctx.formRef.current?.secret })} />
          </div>
        </div>
      </div>

      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Aspetto Fisico</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <LabelWithGuide fieldKey="age" label="Età" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={form?.age || ""}
              onChange={e => upd("age", e.target.value)}
              onBlur={() => save({ age: ctx.formRef.current?.age })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="height" label="Altezza" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={cd.height || ""} placeholder="180cm"
              onChange={e => updCd("height", e.target.value)}
              onBlur={() => save({ height: ctx.formRef.current?.character_data?.height })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="weight" label="Peso" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={cd.weight || ""} placeholder="80kg"
              onChange={e => updCd("weight", e.target.value)}
              onBlur={() => save({ weight: ctx.formRef.current?.character_data?.weight })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="eyes" label="Occhi" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={cd.eyes || ""} placeholder="Azzurri"
              onChange={e => updCd("eyes", e.target.value)}
              onBlur={() => save({ eyes: ctx.formRef.current?.character_data?.eyes })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="skin" label="Carnagione" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={cd.skin || ""} placeholder="Olivastra"
              onChange={e => updCd("skin", e.target.value)}
              onBlur={() => save({ skin: ctx.formRef.current?.character_data?.skin })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="hair" label="Capelli" />
            <input type="text" className="veil-input mt-1 w-full text-sm"
              value={cd.hair || ""} placeholder="Corvino, lungo"
              onChange={e => updCd("hair", e.target.value)}
              onBlur={() => save({ hair: ctx.formRef.current?.character_data?.hair })} />
          </div>
        </div>
      </div>

      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Lingue</h3>
        <p className="text-sm text-white/70">🗣️ {ctx.raceData?.languages?.join(", ") || "—"}</p>
        <p className="text-[10px] text-white/30 mt-1">Lingue conosciute dalla razza (non modificabili).</p>
      </div>
    </div>
    </CollapseSection>
  );
}