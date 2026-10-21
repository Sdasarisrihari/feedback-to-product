import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { oauthReturnPath } from "@/lib/oauth-return-path";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: oauthReturnPath(s.next),
  }),
  head: () => ({
    meta: [
      { title: "Sign in · VoC Intelligence Agent" },
      { name: "description", content: "Sign in to save your feedback workspace, PRDs and tasks." },
      { property: "og:title", content: "Sign in · VoC Intelligence Agent" },
      { property: "og:description", content: "Sign in to save your feedback workspace, PRDs and tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") navigate({ to: "/", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg({ kind: "error", text: error.message });
      else if (!data.session) setMsg({ kind: "info", text: "Check your email to confirm your account, then sign in." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "error", text: error.message });
    }
    setBusy(false);
  }

  async function google() {
    setMsg(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ kind: "error", text: "Google sign-in failed. Please try again." });
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <Card>
        <CardHeader><CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
          <p className="text-sm text-muted-foreground">Signing in saves your workspace to the cloud. Without an account you can still use the browser-only demo.</p></CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="text-center text-xs text-muted-foreground">or</div>
          <form onSubmit={submit} className="space-y-3">
            <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" autoComplete="email" />
            <Input type="password" required minLength={8} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            <Button type="submit" className="w-full" disabled={busy}>{mode === "signin" ? "Sign in" : "Create account"}</Button>
          </form>
          {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`text-sm ${msg.kind === "error" ? "text-destructive" : "text-muted-foreground"}`}>{msg.text}</p>}
          <button className="text-sm text-primary underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}>
            {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
