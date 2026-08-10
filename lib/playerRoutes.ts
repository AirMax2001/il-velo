import type { SupabaseClient } from "@supabase/supabase-js";

// Unico punto di scrittura per i player: merge sempre dei campi parziali di
// character_data sulla riga corrente, così snapshot stale non si sovrascrivono.
export async function updatePlayerWithMerge(
  db: SupabaseClient,
  id: string,
  fields: Record<string, any>
): Promise<{ data: any; error: any }> {
  const cleanFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (k === "character_data" && v && typeof v === "object") {
      const { _merge, ...cdPartial } = v as Record<string, any>;
      const { data: current } = await db
        .from("players")
        .select("character_data")
        .eq("id", id)
        .single();
      cleanFields.character_data = { ...((current?.character_data as Record<string, any>) || {}), ...cdPartial };
      continue;
    }
    cleanFields[k] = v;
  }
  return db.from("players").update(cleanFields).eq("id", id).select().single();
}

export async function deletePlayerCascade(db: SupabaseClient, id: string) {
  await db.from("inventory_items").delete().eq("player_id", id);
  await db.from("memory_entries").delete().eq("player_id", id);
  await db.from("echo_messages").delete().eq("player_id", id);
  await db.from("secrets").delete().eq("player_id", id);
  await db.from("player_diary_entries").delete().eq("player_id", id);
  await db.from("player_thoughts").delete().eq("player_id", id);
  await db.from("roleplay_messages").delete().eq("player_id", id);
  await db.from("entity_links").delete().or(`source_id.eq.${id},target_id.eq.${id}`);
}