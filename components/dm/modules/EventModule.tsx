"use client";

import { EntityCrud } from "../EntityCrud";

export function EventModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Eventi"
      apiBase="events"
      table="events"
      entityType="event"
      searchFields={["title", "description"]}
      defaultForm={{ title: "", description: "", trigger_type: "manual", is_public: true, image_url: "" }}
      fields={[
        { key: "title", label: "Titolo", type: "text", placeholder: "Titolo evento" },
        { key: "description", label: "Descrizione", type: "textarea", placeholder: "Cosa accade durante l'evento" },
        { key: "trigger_type", label: "Tipo trigger", type: "select", options: [
          { value: "manual", label: "Manuale" },
          { value: "automatic", label: "Automatico" }
        ]},
        { key: "is_public", label: "Visibile ai giocatori", type: "checkbox" },
        { key: "image_url", label: "URL immagine", type: "text", placeholder: "URL immagine evento" }
      ]}
      renderListItem={(item: any) => (
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">{item.title}</span>
            <span className="text-[10px] uppercase text-white/40">{item.trigger_type}</span>
          </div>
          {item.description && (
            <p className="mt-0.5 text-xs text-white/50 truncate">{item.description}</p>
          )}
        </div>
      )}
    />
  );
}
