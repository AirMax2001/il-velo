"use client";

import { EntityCrud } from "../EntityCrud";

export function ClueModule({ sessionId }: { sessionId: string }) {
  return (
    <EntityCrud
      sessionId={sessionId}
      title="Indizi"
      apiBase="clues"
      table="clues"
      entityType="clue"
      searchFields={["title", "content"]}
      defaultForm={{ title: "", content: "", is_secret: false }}
      fields={[
        { key: "title", label: "Titolo", type: "text", placeholder: "Titolo indizio" },
        { key: "content", label: "Contenuto", type: "textarea", placeholder: "Cosa rivela l'indizio" },
        { key: "is_secret", label: "Segreto (visibile solo al DM)", type: "checkbox" }
      ]}
      renderListItem={(item: any) => (
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">{item.title}</span>
            {item.is_secret && <span className="text-[10px] text-veil-accent">SEGRETO</span>}
          </div>
          {item.content && (
            <p className="mt-0.5 text-xs text-white/50 truncate">{item.content}</p>
          )}
        </div>
      )}
    />
  );
}
