"use client";
import { AbilityReferenceTables } from "@/components/shared/AbilityReferenceTables";
import { SpellReferenceTables } from "@/components/shared/SpellReferenceTables";
import { CollapseSection } from "./ui";

export function RulesTab() {
  return (
    <div className="space-y-3">
      <CollapseSection
        title="Caratteristiche"
        subtitle="Riepilogo di cosa rappresenta e dove si usa ogni caratteristica."
      >
        <AbilityReferenceTables />
      </CollapseSection>
      <CollapseSection
        title="Trucchetti e Incantesimi"
        subtitle="Tutti i trucchetti e gli incantesimi del gioco con descrizione completa."
      >
        <SpellReferenceTables />
      </CollapseSection>
      <p className="text-[10px] text-white/20 text-center">Tabella riassuntiva delle regole base.</p>
    </div>
  );
}