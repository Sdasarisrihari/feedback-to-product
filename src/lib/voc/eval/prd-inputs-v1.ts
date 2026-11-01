/** Separately tasked author did not inspect production prompts/scorers/fixtures.
 * Same AI system, synthetic, not external/human independence. No expected labels here.
 * Feedback/doc text retained from author's output; metadata reduced to production input.
 */
import type { PrdSourceInput } from "../prd-schema";
const f = (id: string, text: string, segment = "smb") => ({ id, text, segment, source: "synthetic_challenge" });
export const PRD_SCENARIOS: { id: string; input: PrdSourceInput }[] = [
  { id: "syn-01", input: { theme: { name: "Unpaid invoice discovery", summary: "Difficulty locating unpaid invoices", productArea: "Invoices", kind: "feature_request" }, feedback: [
    f("f101", "I have to open each invoice one at a time to see whether it was paid. A filter for unpaid invoices would save me a lot of time when I follow up with customers."),
    f("f102", "Please add an unpaid-only invoice view. I currently check every invoice manually before sending reminders."),
    f("f103", "Finding overdue invoices takes too many clicks. A filter for unpaid invoices would make collections easier.", "mid_market")], docs: [] } },
  { id: "syn-02", input: { theme: { name: "Weekly digest preferences", summary: "Feedback on digest frequency", productArea: "Notifications", kind: "pain_point" }, feedback: [
    f("f201", "The weekly digest is too noisy; I would rather get fewer notifications.", "enterprise"),
    f("f202", "The weekly digest is useful. Please keep sending it every week.", "enterprise")], docs: [] } },
  { id: "syn-03", input: { theme: { name: "Usage report spreadsheet export", summary: "Finance requests spreadsheet downloads", productArea: "Reporting", kind: "feature_request" }, feedback: [
    f("f301", "We need a way to export the monthly usage report as a spreadsheet for finance.", "mid_market"),
    f("f302", "I can view the monthly usage report, but I cannot download it as a spreadsheet.")], docs: [
    { id: "doc-301", title: "Quarterly roadmap note", text: "Usage reporting: spreadsheet export is explicitly out of scope for the current quarter." },
    { id: "doc-302", title: "Sales enablement brief", text: "Usage reporting: spreadsheet export is a committed launch item for the current quarter." }] } },
  { id: "syn-04", input: { theme: { name: "Dark mode feature request", summary: "Assess customer evidence for a dark mode feature request.", productArea: "Dashboard", kind: "feature_request" }, feedback: [
    f("f401", "The dashboard takes a long time to load on Monday mornings."),
    f("f402", "The dashboard sometimes freezes when I open the activity chart.", "mid_market")], docs: [
    { id: "doc-401", title: "Feature request prompt", text: "Assess customer evidence for a dark mode feature request." }] } },
  { id: "syn-05", input: { theme: { name: "Conversation handoff", summary: "Ownership and handoff context", productArea: "Conversations", kind: "feature_request" }, feedback: [
    f("f501", "I need to assign a conversation to a teammate, and I also need a way to add a private note before handing it off."),
    f("f502", "It is hard to tell who owns a conversation. Assigning it to a specific teammate would help."),
    f("f503", "Private internal notes would let our agents leave context for the next person without sending it to the customer.", "mid_market")], docs: [] } },
  { id: "syn-06", input: { theme: { name: "Data sync status visibility", summary: "Customers want to find sync status", productArea: "Data sync", kind: "pain_point" }, feedback: [
    f("f601", "I cannot tell whether the nightly data sync finished without opening the settings page.", "enterprise"),
    f("f602", "A clear status for the data sync would be helpful.", "unknown")], docs: [] } },
];