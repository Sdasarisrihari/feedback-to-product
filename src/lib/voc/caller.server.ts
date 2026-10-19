/**
 * Optional caller resolution for AI functions. No Authorization header → signed-out demo
 * (browser-supplied sources). A header that is present but invalid is an error, never a downgrade.
 * Saved sources are read with the caller's own token, so RLS enforces ownership.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

type Saved = { feedback: Map<string, string>; docs: Map<string, string> };

export async function loadSavedSources(feedbackIds: string[], docIds: string[]): Promise<
  { mode: "signed_out" } | { mode: "signed_in"; saved: Saved } | { mode: "error"; message: string }
> {
  const auth = getRequest()?.headers.get("authorization");
  if (!auth) return { mode: "signed_out" };
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!token || token.split(".").length !== 3 || !url || !key) return { mode: "error", message: "Your session is invalid. Sign in again." };
  const db = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data: claims, error } = await db.auth.getClaims(token);
  if (error || !claims?.claims?.sub) return { mode: "error", message: "Your session is invalid. Sign in again." };
  const saved: Saved = { feedback: new Map(), docs: new Map() };
  try {
    for (let i = 0; i < feedbackIds.length; i += 200) {
      const { data, error: e } = await db.from("feedback_records").select("id, body").in("id", feedbackIds.slice(i, i + 200));
      if (e) throw e;
      for (const r of data ?? []) saved.feedback.set(r.id as string, r.body as string);
    }
    for (let i = 0; i < docIds.length; i += 200) {
      const { data, error: e } = await db.from("doc_sections").select("id, body").in("id", docIds.slice(i, i + 200));
      if (e) throw e;
      for (const r of data ?? []) saved.docs.set(r.id as string, r.body as string);
    }
  } catch (e) {
    console.error("[voc] loadSavedSources failed", (e as { code?: string }).code);
    return { mode: "error", message: "Could not check your sources against the saved workspace. Retry in a moment." };
  }
  return { mode: "signed_in", saved };
}
