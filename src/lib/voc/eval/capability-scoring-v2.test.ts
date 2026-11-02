import { expect, it } from "vitest";
import { scoreCapabilityV2 } from "./capability-scoring-v2";
it("scores universal availability against the explicit excluded group", () => {
  expect(scoreCapabilityV2("CQ-05", [{ capability: "Audit downloads for every workspace", claimed: "not_documented" }])).toBe(true);
  expect(scoreCapabilityV2("CQ-05", [{ capability: "Audit downloads for every workspace", claimed: "documented" }])).toBe(false);
});
it("requires both translation denial and unmeasured savings uncertainty", () => {
  const translation = { capability: "Automatic task translation", claimed: "not_documented" as const };
  expect(scoreCapabilityV2("CQ-06", [translation, { capability: "Saving 500 hours", claimed: "unknown" }])).toBe(true);
  expect(scoreCapabilityV2("CQ-06", [translation])).toBe(false);
  expect(scoreCapabilityV2("CQ-06", [translation, { capability: "Saving 500 hours", claimed: "documented" }])).toBe(false);
});