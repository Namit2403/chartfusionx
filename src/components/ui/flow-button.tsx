import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlowButton({
  text = "Modern Button",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-[18px] border border-border bg-surface px-8 py-3 text-sm font-medium text-foreground transition-all duration-500 hover:border-foreground",
        className,
      )}
    >
      {/* Left arrow */}
      <ArrowRight className="absolute left-[-25%] z-10 size-4 rotate-180 opacity-0 transition-all duration-700 group-hover:left-3 group-hover:opacity-100 group-hover:text-primary-foreground" />

      {/* Text */}
      <span className="relative z-10 -translate-x-2 transition-all duration-700 group-hover:translate-x-2 group-hover:text-primary-foreground">
        {text}
      </span>

      {/* Expanding circle */}
      <span className="absolute left-[8%] top-1/2 size-1 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-all duration-700 group-hover:left-0 group-hover:size-[110%] group-hover:rounded-[18px] group-hover:opacity-100" />

      {/* Right arrow */}
      <ArrowRight className="relative z-10 size-4 -translate-x-1 transition-all duration-700 group-hover:translate-x-[160%] group-hover:opacity-0" />
    </span>
  );
}
