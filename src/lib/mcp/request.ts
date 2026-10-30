/** Bound each database request and propagate MCP cancellation without logging payloads. */
export const MCP_READ_TIMEOUT_MS = 15_000;

export function boundedFetch(signal: AbortSignal, fetcher: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const sources = [signal, init?.signal].filter((s): s is AbortSignal => s != null);
    const abort = () => controller.abort();
    for (const source of sources) {
      source.addEventListener("abort", abort, { once: true });
      if (source.aborted) abort();
    }
    if (controller.signal.aborted) {
      for (const source of sources) source.removeEventListener("abort", abort);
      throw new DOMException("Request cancelled", "AbortError");
    }
    const timer = setTimeout(abort, MCP_READ_TIMEOUT_MS);
    let rejectAbort: (() => void) | undefined;
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new DOMException("Saved workspace request cancelled or timed out", "AbortError"));
      controller.signal.addEventListener("abort", rejectAbort, { once: true });
      if (controller.signal.aborted) rejectAbort();
    });
    try {
      return await Promise.race([fetcher(input, { ...init, signal: controller.signal }), aborted]);
    } finally {
      clearTimeout(timer);
      for (const source of sources) source.removeEventListener("abort", abort);
      if (rejectAbort) controller.signal.removeEventListener("abort", rejectAbort);
    }
  };
}