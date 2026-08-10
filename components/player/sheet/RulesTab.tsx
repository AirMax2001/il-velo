"use client";
import { AbilityReferenceTables } from "@/components/shared/AbilityReferenceTables";
import { SpellReferenceTables } from "@/components/shared/SpellReferenceTables";

export function RulesTab() {
  return (
    <div className="space-y-4">
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Caratteristiche</h3>
        <p className="text-[10px] text-white/30 mb-3">Riepilogo di cosa rappresenta e dove si usa ogni caratteristica.</p>
        <AbilityReferenceTables />
      </div>
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Trucchetti e Incantesimi</h3>
        <p className="text-[10px] text-white/30 mb-3">Riepilogo dei trucchetti e degli incantesimi di riferimento del gioco.</p>
        <SpellReferenceTables />
      </div>
      <p className="text-[10px] text-white/20 text-center">Tabella riassuntiva delle regole base.</p>
    </div>
  );
}