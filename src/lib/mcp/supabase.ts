/**
 * Authenticated Supabase client for MCP tool handlers. The caller's verified OAuth
 * token is attached so row-level security scopes every query to that user's rows.
 */
import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "@/integrations/supabase/types";
import { boundedFetch } from "./request";

function supabaseProjectUrl(): string {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  if (!url) throw new Error("Supabase URL is not configured");
  return url;
}

function supabasePublishableKey(): string {
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!key) throw new Error("Supabase publishable key is not configured");
  return key;
}

export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("supabaseForUser requires a verified OAuth token");
  return createClient<Database>(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: boundedFetch(ctx.signal) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
