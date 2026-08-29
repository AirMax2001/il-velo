"use client";
import { MinecraftInventory } from "./MinecraftInventory";
import type { CharacterData } from "@/lib/types";
import type { SheetCtx } from "./types";

const COIN_TYPES = [
  { key: "pp", label: "PP", desc: "Platino", color: "text-blue-200" },
  { key: "gp", label: "GP", desc: "Oro", color: "text-veil-gold" },
  { key: "ep", label: "PE", desc: "Electrum", color: "text-emerald-300" },
  { key: "sp", label: "SA", desc: "Argento", color: "text-gray-300" },
  { key: "cp", label: "MC", desc: "Rame", color: "text-orange-300" },
];

export function GearTab({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, level, pb, updCd, save, onAddAttack } = ctx;

  return (
    <div className="space-y-4">
      {/* Inventario a griglia */}
      <MinecraftInventory player={form || ({} as any)} cd={cd} level={level} pb={pb} onAddAttack={onAddAttack} save={save} updCd={updCd} />

      {/* Monete */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Monete</h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {COIN_TYPES.map(c => (
            <div key={c.key}>
              <p className={`text-[10px] uppercase font-bold mb-1 ${c.color}`}>{c.label}</p>
              <p className="text-[9px] text-white/20 mb-1">{c.desc}</p>
              <input type="number" className="veil-input w-full text-center text-sm font-medium p-1.5" min={0}
                value={(cd as any)[c.key] ?? 0}
                onChange={e => updCd(c.key, Number(e.target.value))}
                onBlur={() => save({ [c.key]: ctx.formRef.current?.character_data?.[c.key as keyof CharacterData] })} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-3 text-center">
          1 PP = 10 GP = 50 SA = 100 MC
        </p>
      </div>
    </div>
  );
}
