import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

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

export function AccountMenu() {
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  useEffect(() => {
    setAcceptedAt(readProfile().legalAcceptedAt ?? null);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Account" className="rounded-full">
          <UserRound className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Account
        </DropdownMenuLabel>
        <div className="space-y-1.5 px-2 pb-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Number</span>
            <span className="num">#FX-88421</span>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
