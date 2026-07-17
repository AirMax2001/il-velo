"use client";

import { useEffect, useState } from "react";

type RefGroup = {
  label: string;
  icon: string;
  items: { id: string; name: string }[];
};

type ReferencedByProps = {
  sessionId: string;
  entityType: string;
  entityId: string;
};

export function ReferencedBy({ sessionId, entityType, entityId }: ReferencedByProps) {
  const [groups, setGroups] = useState<RefGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !entityId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/relationships?sessionId=${sessionId}&entityType=${entityType}&entityId=${entityId}`).then(r => r.json()),
      fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/quests?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/timeline?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/notes?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/factions?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/relics?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/events?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json())
    ]).then(([linksData, npcsData, questsData, timelineData, notesData, locationsData, factionsData, relicsData, eventsData, playersData]) => {
      const links = linksData.items || [];
      const npcs = npcsData.items || [];
      const quests = questsData.items || [];
      const timeline = timelineData.items || [];
      const notes = notesData.items || [];
      const locations = locationsData.locations || [];
      const factions = factionsData.items || [];
      const relics = relicsData.items || [];
      const events = eventsData.items || [];
      const players = playersData.players || [];

      const buildRefs = (type: string, items: any[]) => {
        return links
          .filter((l: any) => {
            if (l.source_type === entityType && l.source_id === entityId && l.target_type === type) return true;
            if (l.target_type === entityType && l.target_id === entityId && l.source_type === type) return true;
            return false;
          })
          .map((l: any) => {
            const targetId = l.source_type === type ? l.source_id : l.target_id;
            const item = items.find((i: any) => i.id === targetId);
            return item ? { id: item.id, name: item.name || item.title || item.character_name } : { id: targetId, name: "???" };
          })
          .filter((v: any, i: number, a: any[]) => a.findIndex((x: any) => x.id === v.id) === i);
      };

      const result: RefGroup[] = [];
      const npcRefs = buildRefs("npc", npcs);
      if (npcRefs.length) result.push({ label: "NPC", icon: "◆", items: npcRefs });

      const questRefs = buildRefs("quest", quests);
      if (questRefs.length) result.push({ label: "Quest", icon: "⚔", items: questRefs });

      const timelineRefs = buildRefs("timeline_event", timeline);
      if (timelineRefs.length) result.push({ label: "Timeline", icon: "◈", items: timelineRefs });

      const noteRefs = buildRefs("note", notes);
      if (noteRefs.length) result.push({ label: "Note DM", icon: "📜", items: noteRefs });

      const locationRefs = buildRefs("location", locations);
      if (locationRefs.length) result.push({ label: "Luoghi", icon: "⌂", items: locationRefs });

      const factionRefs = buildRefs("faction", factions);
      if (factionRefs.length) result.push({ label: "Fazioni", icon: "⚑", items: factionRefs });

      const relicRefs = buildRefs("relic", relics);
      if (relicRefs.length) result.push({ label: "Reliquie", icon: "◇", items: relicRefs });

      const eventRefs = buildRefs("event", events);
      if (eventRefs.length) result.push({ label: "Eventi", icon: "▶", items: eventRefs });

      const playerRefs = buildRefs("player", players);
      if (playerRefs.length) result.push({ label: "Personaggi", icon: "●", items: playerRefs });

      setGroups(result);
      setLoading(false);
    });
  }, [sessionId, entityType, entityId]);

  if (loading) return null;
  if (groups.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-veil-gold/15 bg-black/20 p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.24em] text-veil-gold/60">Referenced By</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 text-xs text-white/50">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.map(item => (
                <span key={item.id} className="flex items-center gap-1.5 text-sm text-white/75">
                  <span className="text-veil-gold/60">{group.icon}</span>
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
