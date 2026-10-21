import { Link } from "@tanstack/react-router";
import { AlertTriangle, Cloud, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoc } from "@/lib/voc/store";

/** Sidebar account block: shows where data is saved and the sign-in / sign-out action. */
export function AccountBlock() {
  const { cloud, signOut } = useVoc();
  if (cloud.mode === "local") return (
    <div className="m-3 space-y-2 rounded-md border border-sidebar-border p-3 text-xs">
      <div className="flex items-center gap-2 opacity-80"><HardDrive className="h-3.5 w-3.5" />Demo · saved in this browser only</div>
      <Link to="/auth" search={{ next: "/" }} className="block rounded-md bg-sidebar-primary px-3 py-1.5 text-center font-medium text-sidebar-primary-foreground">Sign in to save</Link>
    </div>
  );
  return (
    <div className="m-3 space-y-2 rounded-md border border-sidebar-border p-3 text-xs">
      <div className="flex items-center gap-2"><Cloud className="h-3.5 w-3.5" /><span className="truncate">{cloud.email}</span></div>
      <div className="opacity-80">{cloud.load === "loading" ? "Loading…" : cloud.load === "error" ? "Not loaded" : cloud.save === "saving" ? "Saving…" : cloud.save === "error" ? "Not saved" : "All changes saved"}</div>
      <button onClick={signOut} className="underline opacity-80 hover:opacity-100">Sign out</button>
    </div>
  );
}

/** Page-level banners: load/save errors with retry, and the one-time browser import offer. */
export function CloudBanners() {
  const { cloud, retryCloud, pendingImport, acceptImport, declineImport } = useVoc();
  return (
    <>
      {cloud.mode === "cloud" && cloud.load === "loading" && <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your saved workspace…</div>}
      {cloud.mode === "cloud" && (cloud.load === "error" || cloud.save === "error") && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />{cloud.message}<Button size="sm" variant="outline" onClick={retryCloud}>Retry</Button>
        </div>
      )}
      {pendingImport && (
        <div className="mb-4 rounded-md border border-primary/30 bg-accent p-4 text-sm text-accent-foreground">
          <p className="font-medium">Copy this browser's data into your account?</p>
          <p className="mt-1">Found {pendingImport.records} feedback records, {pendingImport.docs} documents, {pendingImport.prds} PRDs and {pendingImport.tasks} tasks saved in this browser. Your account is empty. The browser copy is kept either way.</p>
          <div className="mt-3 flex gap-2"><Button size="sm" onClick={acceptImport}>Import into my account</Button><Button size="sm" variant="outline" onClick={declineImport}>Start empty</Button></div>
        </div>
      )}
    </>
  );
}
