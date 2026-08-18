import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        CP
      </span>
      <span className="text-base font-semibold tracking-tight">
        CommercePilot
      </span>
    </div>
  );
}
