import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthGlassInput, AuthSceneCard } from "@/components/auth-scene";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — ChartFusionX" },
      {
        name: "description",
        content: "Choose a new password for your ChartFusionX trading journal account.",
      },
      { property: "og:title", content: "Reset password — ChartFusionX" },
      {
        property: "og:description",
        content: "Set a new password and get back to your AI trading journal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    void supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session) || isRecovery);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/app", replace: true });
  };

  return (
    <AuthSceneCard
      title="Set a new password"
      subtitle="Choose a strong password and get back to your journal."
    >
      {ready ? (
        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-medium text-white/60">
              New password
            </label>
            <AuthGlassInput
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <button type="submit" disabled={busy} className="auth-primary-btn">
            {busy ? "One moment…" : "Update password"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/60">
          This reset link is invalid or has expired. Request a new one from the sign-in page.
        </div>
      )}
    </AuthSceneCard>
  );
}
