import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { readProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";

export function AccountMenu() {
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setAcceptedAt(readProfile().legalAcceptedAt ?? null);
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!user) {
    return (
      <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/auth" })}>
        Sign in
      </Button>
    );
  }

  const name =
    (user.user_metadata?.["display_name"] as string | undefined) ??
    (user.user_metadata?.["full_name"] as string | undefined) ??
    user.email?.split("@")[0] ??
    "Trader";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Account" className="rounded-full">
          <UserRound className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Account
        </DropdownMenuLabel>
        <div className="space-y-1.5 px-2 pb-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Signed in</span>
            <span className="truncate">{name}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="text-positive">Live</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance</span>
            <span className="num font-semibold">$12,405.99</span>
          </div>
          {acceptedAt && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Terms accepted</span>
              <span className="num text-xs">
                {new Date(acceptedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Switch account</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
