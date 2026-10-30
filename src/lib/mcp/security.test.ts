import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { auth, defineMcp, setLogLevel, ToolContext } from "@lovable.dev/mcp-js";
import { createMcpProtocolHandler } from "@lovable.dev/mcp-js/protocols/mcp";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import evidence from "./tools/get-feedback-evidence";
import docs from "./tools/search-product-docs";
import theme from "./tools/get-theme";
import { boundedFetch, MCP_READ_TIMEOUT_MS } from "./request";

const issuer = "https://oauth-test.invalid";
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let jwk: Awaited<ReturnType<typeof exportJWK>>;

beforeAll(async () => {
  setLogLevel("silent");
  keys = await generateKeyPair("ES256");
  jwk = { ...await exportJWK(keys.publicKey), kid: "test-key", alg: "ES256" };
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

async function token(options: { expired?: boolean; client?: boolean; audience?: string } = {}) {
  return new SignJWT(options.client === false ? {} : { client_id: "test-client" })
    .setProtectedHeader({ alg: "ES256", typ: "JWT", kid: "test-key" })
    .setSubject("owner-A").setIssuer(issuer).setAudience(options.audience ?? "authenticated")
    .setExpirationTime(options.expired ? 1 : Math.floor(Date.now() / 1000) + 300).sign(keys.privateKey);
}

async function protocolCall(bearer?: string, params = { method: "tools/list", params: {} }) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ keys: [jwk] })));
  const handler = createMcpProtocolHandler(defineMcp({
    name: "security-test", title: "Security test", tools: [evidence, docs, theme],
    auth: auth.oauth.issuer({ issuer, jwksUri: issuer + "/jwks", acceptedAudiences: "authenticated" }),
  }));
  return handler(new Request("https://app-test.invalid/mcp", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-03-26", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...params }),
  }));
}

describe("real SDK OAuth verifier (isolated issuer, not production tokens)", () => {
  it("accepts a correctly signed OAuth token and advertises exactly three closed schemas", async () => {
    const r = await protocolCall(await token());
    expect(r.status).toBe(200);
    const body = await r.text();
    expect(body).toContain('"get_feedback_evidence"');
    expect(body).toContain('"search_product_docs"');
    expect(body).toContain('"get_theme"');
    expect(body).toContain('"additionalProperties":false');
  });
  it("rejects a correctly signed but expired OAuth token", async () => {
    expect((await protocolCall(await token({ expired: true }))).status).toBe(401);
  });
  it("rejects a copied session without an OAuth client claim", async () => {
    expect((await protocolCall(await token({ client: false }))).status).toBe(401);
  });
  it("rejects wrong audience and missing credentials", async () => {
    expect((await protocolCall(await token({ audience: "other" }))).status).toBe(401);
    expect((await protocolCall()).status).toBe(401);
  });
  it("rejects excessive document limits before reading the database", async () => {
    const r = await protocolCall(await token(), { method: "tools/call", params: { name: "search_product_docs", arguments: { query: "export", limit: 21 } } });
    expect(await r.text()).toContain('"isError":true');
  });
});

describe("bounded database requests", () => {
  it("returns successful responses unchanged", async () => {
    const r = await boundedFetch(new AbortController().signal, vi.fn(async () => new Response("ok")))("https://test.invalid");
    expect(await r.text()).toBe("ok");
  });
  it("ends stalled requests after exactly 15 seconds even when upstream ignores abort", async () => {
    vi.useFakeTimers();
    expect(MCP_READ_TIMEOUT_MS).toBe(15_000);
    const pending = boundedFetch(new AbortController().signal, vi.fn(() => new Promise<Response>(() => {})))("https://test.invalid");
    const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });
  it("propagates client cancellation to the upstream request", async () => {
    const controller = new AbortController();
    let upstream: AbortSignal | null | undefined;
    const pending = boundedFetch(controller.signal, vi.fn((_url, init) => { upstream = init?.signal; return new Promise<Response>(() => {}); }))("https://test.invalid");
    const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await assertion;
    expect(upstream?.aborted).toBe(true);
  });
  it("does not start an already-cancelled request", async () => {
    const c = new AbortController(); c.abort();
    const fetcher = vi.fn(async () => new Response());
    await expect(boundedFetch(c.signal, fetcher)("https://test.invalid")).rejects.toMatchObject({ name: "AbortError" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("real tool handlers with controlled database failures (not live RLS)", () => {
  const context = new ToolContext({ type: "oauth", principal: { sub: "owner-A", claims: {}, issuer, resource: "test", acceptedAudiences: ["authenticated"], scopes: [], clientId: "test" }, bearer: { token: "synthetic-test-token" } });
  it("rejects unauthenticated handler access", async () => {
    await expect(evidence.handler({}, new ToolContext(undefined))).rejects.toThrow("verified OAuth token");
  });
  it("returns empty feedback and document results without fabricated evidence", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    const feedback = await evidence.handler({}, context);
    const documents = await docs.handler({ query: "export" }, context);
    expect(feedback.structuredContent).toMatchObject({ totalMatched: 0, records: [] });
    expect(documents.structuredContent).toMatchObject({ totalMatched: 0, sections: [] });
    await expect(theme.handler({ themeId: "foreign-theme" }, context)).rejects.toThrow();
  });
  it("each handler returns only a safe retry error on database failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "PRIVATE-UPSTREAM-DETAIL", code: "XX000" }, { status: 500 })));
    await expect(evidence.handler({}, context)).rejects.toThrow("Could not read feedback records. Try again later.");
    await expect(docs.handler({ query: "export" }, context)).rejects.toThrow("Could not read saved documents. Try again later.");
    await expect(theme.handler({ themeId: "T1" }, context)).rejects.toThrow("Could not read saved analysis. Try again later.");
  });
  it("does not return partial document results when the section read fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input) => String(input).includes("product_docs")
      ? Response.json([{ id: "D1", title: "Saved doc", version: "1", kind: "help_center" }])
      : Response.json({ message: "failed" }, { status: 503 })));
    await expect(docs.handler({ query: "export" }, context)).rejects.toThrow("Could not read saved documents");
  });
});