"use client";

import { EntityCrud } from "../EntityCrud";

export function TimelineModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Timeline"
      apiBase="timeline"
      table="timeline_events"
      entityType="timeline_event"
      searchFields={["title", "content"]}
      defaultForm={{ title: "", content: "", era: "sessions", event_date: "" }}
      fields={[
        { key: "title", label: "Titolo", type: "text", placeholder: "Titolo evento" },
        { key: "content", label: "Contenuto", type: "textarea", placeholder: "Descrizione dell'evento" },
        { key: "era", label: "Era", type: "select", options: [
          { value: "ancient_lore", label: "Lore antica" },
          { value: "previous_events", label: "Eventi precedenti" },
          { value: "sessions", label: "Sessioni" },
          { value: "future_events", label: "Eventi futuri" }
        ]},
        { key: "event_date", label: "Data evento", type: "text", placeholder: "Data o riferimento temporale" }
      ]}
      renderListItem={(item: any) => {
        const eraLabels: Record<string, string> = {
          ancient_lore: "Antica", previous_events: "Precedenti",
          sessions: "Sessione", future_events: "Futuro"
        };
        return (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-white">{item.title}</span>
              <span className="text-[10px] text-white/40">{eraLabels[item.era] || item.era}</span>
            </div>
            {item.content && (
              <p className="mt-0.5 text-xs text-white/50 truncate">{item.content}</p>
            )}
          </div>
        );
      }}
    />
  );
}
