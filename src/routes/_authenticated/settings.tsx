import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { deleteAccount, updateAccountProfile } from "@/utils/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — ChartFusionX" },
      {
        name: "description",
        content:
          "Update your ChartFusionX display name, change your password or permanently delete your trading account.",
      },
      { property: "og:title", content: "Account settings — ChartFusionX" },
      {
        property: "og:description",
        content: "Manage your ChartFusionX profile, password and account deletion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const saveProfile = useServerFn(updateAccountProfile);
  const removeAccount = useServerFn(deleteAccount);

  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? null);
      setDisplayName(
        (user.user_metadata?.["display_name"] as string | undefined) ??
          (user.user_metadata?.["full_name"] as string | undefined) ??
          "",
      );
      setAvatarUrl((user.user_metadata?.["avatar_url"] as string | undefined) ?? "");
    });
  }, []);

  const onSaveProfile = async () => {
    setBusy("profile");
    try {
      const result = await saveProfile({ data: { displayName, avatarUrl: avatarUrl || null } });
      if (!result.ok) {
        toast.error(result.message ?? "Could not save your profile");
        return;
      }
      toast.success("Profile updated.");
    } finally {
      setBusy(null);
    }
  };

  const onChangePassword = async () => {
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The two passwords don't match.");
      return;
    }
    setBusy("password");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    setBusy("delete");
    try {
      const result = await removeAccount({
        data: { environment: getPaddleEnvironment(), confirm: confirmText },
      });
      if (!result.ok) {
        toast.error(result.message ?? "Could not delete your account");
        return;
      }
      await supabase.auth.signOut();
      toast.success("Your account and all its data have been deleted.");
      void navigate({ to: "/auth", replace: true });
    } finally {
      setBusy(null);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your profile, sign-in details and account removal. Billing lives on the plans page.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to be addressed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email ?? ""} disabled readOnly />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avatar">Avatar image URL</Label>
          <Input
            id="avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <Button onClick={() => void onSaveProfile()} disabled={busy !== null}>
          {busy === "profile" && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save profile
        </Button>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => void onChangePassword()}
          disabled={busy !== null}
        >
          {busy === "password" && <Loader2 className="mr-2 size-4 animate-spin" />}
          Change password
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <ShieldAlert className="size-4" /> Delete account
        </h2>
        <p className="text-sm text-muted-foreground">
          This permanently removes your trades, journal entries, uploads and usage history. Any
          active subscription is canceled first so you're never billed again. This cannot be
          undone.
        </p>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={busy !== null}>
          Delete my account
        </Button>
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Every trade, screenshot and AI record tied to this account is erased, and your
              subscription is canceled. Type DELETE below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onDelete();
              }}
            >
              {busy === "delete" && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
