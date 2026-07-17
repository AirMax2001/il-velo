"use client";

import { EntityCrud } from "../EntityCrud";

export function QuestModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Quest"
      apiBase="quests"
      table="quests"
      entityType="quest"
      searchFields={["title", "description"]}
      defaultForm={{ title: "", description: "", status: "todo", quest_type: "main" }}
      fields={[
        { key: "title", label: "Titolo", type: "text", placeholder: "Titolo quest" },
        { key: "description", label: "Descrizione", type: "textarea", placeholder: "Descrizione e obiettivi" },
        { key: "status", label: "Stato", type: "select", options: [
          { value: "todo", label: "Da iniziare" },
          { value: "active", label: "Attiva" },
          { value: "completed", label: "Completata" },
          { value: "failed", label: "Fallita" }
        ]},
        { key: "quest_type", label: "Tipo", type: "select", options: [
          { value: "main", label: "Principale" },
          { value: "side", label: "Secondaria" },
          { value: "personal", label: "Personale" },
          { value: "faction", label: "Fazione" }
        ]}
      ]}
      renderListItem={(item: any) => {
        const statusColors: Record<string, string> = {
          todo: "text-white/40", active: "text-veil-gold",
          completed: "text-emerald-400", failed: "text-red-400"
        };
        const statusLabels: Record<string, string> = {
          todo: "Da fare", active: "Attiva", completed: "Fatta", failed: "Fallita"
        };
        return (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-white">{item.title}</span>
              <span className={`text-[10px] uppercase ${statusColors[item.status] || "text-white/40"}`}>
                {statusLabels[item.status] || item.status}
              </span>
            </div>
            {item.description && (
              <p className="mt-0.5 text-xs text-white/50 truncate">{item.description}</p>
            )}
          </div>
        );
      }}
    />
  );
}
