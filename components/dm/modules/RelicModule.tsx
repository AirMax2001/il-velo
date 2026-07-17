"use client";

import { EntityCrud } from "../EntityCrud";

export function RelicModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Reliquie"
      apiBase="relics"
      table="relics"
      entityType="relic"
      searchFields={["name", "description", "history"]}
      defaultForm={{ name: "", description: "", history: "", effects: "" }}
      fields={[
        { key: "name", label: "Nome", type: "text", placeholder: "Nome reliquia" },
        { key: "description", label: "Descrizione", type: "textarea", placeholder: "Aspetto e funzione" },
        { key: "history", label: "Storia", type: "textarea", placeholder: "Origine e leggende" },
        { key: "effects", label: "Effetti", type: "textarea", placeholder: "Poteri e conseguenze" }
      ]}
      renderListItem={(item: any) => (
        <div>
          <span className="font-medium text-white">{item.name}</span>
          {item.description && (
            <p className="mt-0.5 text-xs text-white/50 truncate">{item.description}</p>
          )}
        </div>
      )}
    />
  );
}
