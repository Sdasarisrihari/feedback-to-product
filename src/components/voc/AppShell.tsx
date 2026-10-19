import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { BarChart3, ClipboardCheck, FileText, Lightbulb, ListOrdered, Menu, MessageSquareText, Settings, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/feedback", label: "Feedback Explorer", icon: MessageSquareText },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/prioritization", label: "Prioritization", icon: ListOrdered },
  { to: "/prd", label: "PRD Studio", icon: FileText },
  { to: "/tasks", label: "Task Review", icon: ClipboardCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex`}>
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <div className="font-display text-lg font-semibold text-sidebar-accent-foreground">VoC Intelligence</div>
            <div className="text-xs opacity-70">Agent · Trellis demo workspace</div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-primary">
              <Icon className="h-4 w-4" aria-hidden />{label}
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-md border border-sidebar-border p-3 text-xs leading-relaxed opacity-80">
          Phase 3a · synthetic data · server-side AI analysis with verified citations
        </div>
      </aside>
      <div className="flex-1 lg:pl-64">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-display font-semibold">VoC Intelligence</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
