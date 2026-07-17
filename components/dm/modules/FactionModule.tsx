"use client";

import { EntityCrud } from "../EntityCrud";

export function FactionModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Fazioni"
      apiBase="factions"
      table="factions"
      entityType="faction"
      searchFields={["name", "ideology", "description"]}
      defaultForm={{ name: "", description: "", ideology: "", dominant: false }}
      fields={[
        { key: "name", label: "Nome", type: "text", placeholder: "Nome fazione" },
        { key: "ideology", label: "Ideologia", type: "text", placeholder: "Ideologia o credo" },
        { key: "description", label: "Descrizione", type: "textarea", placeholder: "Descrizione e storia" },
        { key: "dominant", label: "Fazione dominante", type: "checkbox" }
      ]}
      renderListItem={(item: any) => (
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">{item.name}</span>
            {item.dominant && <span className="text-[10px] text-veil-gold">DOMINANTE</span>}
          </div>
          {item.ideology && (
            <p className="mt-0.5 text-xs text-white/50 truncate">{item.ideology}</p>
          )}
        </div>
      )}
    />
  );
}
