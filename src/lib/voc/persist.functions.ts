import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TABLES, UPSERT_ORDER, INSERT_ONLY, type Rows, type Table } from "./persist-map";

const PK: Record<Table, string> = {
  feedback_records: "owner_id,id", import_runs: "owner_id,id", product_docs: "owner_id,id", doc_sections: "owner_id,id",
  analysis_runs: "owner_id,id", ai_analyses: "owner_id", ai_prds: "owner_id,id", prd_revisions: "owner_id,prd_id,rev_no",
  draft_tasks: "owner_id,id", workspace_settings: "owner_id", human_reviews: "owner_id,id",
};

const rowArr = z.array(z.record(z.string(), z.unknown())).max(5000);
const syncInput = z.object({
  upserts: z.partialRecord(z.enum(TABLES), rowArr),
  deletes: z.partialRecord(z.enum(TABLES), z.array(z.string().max(300)).max(5000)),
});

type Db = { from: (t: string) => any };

async function selectAll(db: Db, t: Table) {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(t).select("*").range(from, from + 999);
    if (error) throw new Error(`load ${t}: ${error.code ?? "error"}`);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

/** Loads the signed-in user's workspace. RLS limits every query to the caller's rows. */
export const loadWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; rowsJson: string } | { ok: false; message: string }> => {
    try {
      const rows: Partial<Rows> = {};
      for (const t of TABLES) rows[t] = (await selectAll(context.supabase as unknown as Db, t)).map(({ owner_id: _o, updated_at: u, ...r }) => (t === "human_reviews" ? { ...r, updated_at: u } : r));
      return { ok: true, rowsJson: JSON.stringify(rows) };
    } catch (e) {
      console.error("[voc] loadWorkspace failed", (e as Error).message);
      return { ok: false, message: "Could not load your saved workspace. Retry in a moment." };
    }
  });

/** Applies a row diff for the caller. owner_id is always the verified session user, never client input. */
export const syncWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => syncInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; message: string }> => {
    const db = context.supabase as unknown as Db;
    const owner = context.userId;
    try {
      for (const t of [...UPSERT_ORDER].reverse()) {
        const ids = data.deletes[t];
        if (!ids?.length || t === "prd_revisions" || t === "workspace_settings" || t === "ai_analyses") continue;
        const { error } = await db.from(t).delete().eq("owner_id", owner).in("id", ids);
        if (error) throw new Error(`delete ${t}: ${error.code}`);
      }
      if (data.deletes.ai_analyses?.length) {
        const { error } = await db.from("ai_analyses").delete().eq("owner_id", owner);
        if (error) throw new Error(`delete ai_analyses: ${error.code}`);
      }
      for (const t of UPSERT_ORDER) {
        const rows = data.upserts[t];
        if (!rows?.length) continue;
        const stamped = rows.map((r) => {
          const { owner_id: _ignored, ...rest } = r;
          return { ...rest, owner_id: owner, ...(t === "prd_revisions" || t === "doc_sections" || t === "analysis_runs" ? {} : { updated_at: new Date().toISOString() }) };
        });
        for (let i = 0; i < stamped.length; i += 500) {
          const { error } = await db.from(t).upsert(stamped.slice(i, i + 500), { onConflict: PK[t], ignoreDuplicates: INSERT_ONLY.includes(t) });
          if (error) throw new Error(`upsert ${t}: ${error.code}`);
        }
      }
      return { ok: true };
    } catch (e) {
      console.error("[voc] syncWorkspace failed", (e as Error).message);
      return { ok: false, message: "Some changes could not be saved. They are kept on screen — retry to save them." };
    }
  });
