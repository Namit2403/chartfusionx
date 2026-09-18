import { Link, useRouterState } from "@tanstack/react-router";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { CreditCard, Moon, Sun } from "lucide-react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Dna,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  Mic,
  NotebookPen,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";

import { useAuthUser } from "@/hooks/useAuthUser";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const navGroups = [
  {
    label: "Journal",
    items: [
      { title: "Dashboard", url: "/app", icon: LayoutDashboard, soon: false },
      { title: "Trade Journal", url: "/journal", icon: NotebookPen, soon: false },
      { title: "Trade Gallery", url: "/gallery", icon: ImageIcon, soon: false },
      { title: "Playbook", url: "/playbook", icon: BookOpen, soon: false },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3, soon: false },
      { title: "Reports", url: "/reports", icon: FileText, soon: false },
      { title: "Goals & Habits", url: "/goals", icon: Target, soon: false },
      { title: "Notifications", url: "/notifications", icon: BellRing, soon: false },
    ],
  },
  {
    label: "AI Systems",
    items: [
      { title: "AI Trade Review", url: "/ai-review", icon: Sparkles, soon: true },
      { title: "AI Chart Critique", url: "/chart-critique", icon: Gauge, soon: true },
      { title: "Screenshot Reader", url: "/screenshot-reader", icon: Activity, soon: true },
      { title: "Strategy Discovery", url: "/strategy-discovery", icon: LineChart, soon: true },
      { title: "Trader DNA", url: "/trader-dna", icon: Dna, soon: true },
      { title: "Voice Summary", url: "/voice-summary", icon: Mic, soon: true },
    ],
  },
  {
    label: "Beta",
    items: [{ title: "What's Coming", url: "/whats-coming", icon: Rocket, soon: false }],
  },
] as const;

export const coreItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Trade Journal", url: "/journal", icon: NotebookPen },
  { title: "Trade Gallery", url: "/gallery", icon: ImageIcon },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "What's Coming", url: "/whats-coming", icon: Rocket },
];

function resolveFirstName(user: User | null): string | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof meta["full_name"] === "string" ? meta["full_name"].trim() : "";
  if (fullName) return fullName.split(/\s+/)[0] ?? null;
  if (user.email) return user.email.split("@")[0] ?? null;
  return null;
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeader className="p-0">
      <div
        className={cn(
          "flex items-center gap-3 px-3.5 pb-4 pt-5",
          collapsed && "flex-col justify-center",
        )}
      >
        <Link
          to="/app"
          aria-label="ChartFusionX home"
          className="flex min-w-0 flex-col items-center"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_18px_rgba(59,130,246,0.55)]">
            <span className="font-display text-sm font-bold text-white">X</span>
          </span>
          {!collapsed && (
            <span className="mt-2 flex w-full min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-[15px] font-semibold tracking-tight text-white">
                ChartFusionX
              </span>
              <span className="truncate text-[10px] font-medium tracking-[0.18em] text-white/45">
                AI TRADING JOURNAL
              </span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="glass-item flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/55 transition hover:text-white"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <div className="glass-divider mx-4 h-px" />
    </SidebarHeader>
  );
}

function SidebarWelcome({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuthUser();

  if (collapsed) return null;

  const firstName = resolveFirstName(user ?? null);
  const lastLogin = user?.last_sign_in_at
    ? format(new Date(user.last_sign_in_at), "d MMM yyyy")
    : null;

  return (
    <div>
      <div className="px-5 pb-5 pt-6">
        <p className="font-display text-[22px] font-semibold leading-tight tracking-tight text-white">
          {firstName ? `Welcome Back, ${firstName}` : "Welcome Back"}
        </p>
        <p className="mt-2 text-xs text-white/45">
          {lastLogin ? `Last login: ${lastLogin}` : "Sign in to sync your journal"}
        </p>
      </div>
      <div className="glass-divider mx-4 h-px" />
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null;
  const pct = unlimited ? 100 : Math.min(100, limit > 0 ? (used / limit) * 100 : 100);

  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-white/55">{label}</span>
        <span className="num text-white/80">
          {used.toLocaleString()}
          <span className="text-white/40">
            {unlimited ? " · unlimited" : ` / ${limit.toLocaleString()}`}
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            unlimited
              ? "bg-gradient-to-r from-white/40 to-white/20"
              : pct >= 90
                ? "bg-gradient-to-r from-red-500 to-red-400"
                : "bg-gradient-to-r from-violet-400/90 to-sky-300/80",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UpcomingMeter({ label }: { label: string }) {
  return (
    <div title="AI modules are in development — usage tracking unlocks when they launch">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-white/55">{label}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">
          Upcoming
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-full rounded-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.14)_0_5px,transparent_5px,transparent_10px)]" />
      </div>
    </div>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { isDark, toggleTheme } = useTheme();

  if (collapsed) {
    return (
      <SidebarFooter className="p-0 pb-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to daylight mode" : "Switch to midnight mode"}
          className="glass-item mx-auto flex size-9 cursor-pointer items-center justify-center rounded-xl text-white/55 transition hover:text-white"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="p-0 px-3 pb-3">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to daylight mode" : "Switch to midnight mode"}
        className="glass-card flex h-9 w-full cursor-pointer items-center justify-between px-3 text-[12px] font-medium text-white/60 transition hover:text-white"
      >
        <span>{isDark ? "Midnight" : "Daylight"}</span>
        <span className="relative flex h-4 w-7 items-center rounded-full border border-white/15 bg-white/[0.06] px-0.5">
          <span
            className={cn(
              "absolute size-3 rounded-full bg-white transition-all duration-300",
              isDark ? "left-0.5" : "left-[calc(100%-1rem)]",
            )}
          />
        </span>
      </button>
    </SidebarFooter>
  );
}

function SidebarPlanCard({ collapsed }: { collapsed: boolean }) {
  const { planName, tradesUsed, tradeLimit, entitled } = useSubscription();

  if (collapsed) {
    return (
      <SidebarFooter className="p-0 pb-3">
        <Link
          to="/billing"
          aria-label="Plans and usage"
          className="glass-item mx-auto flex size-9 items-center justify-center rounded-xl text-white/55 transition hover:text-white"
        >
          <CreditCard className="size-4" />
        </Link>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="p-0 pb-3">
      <div className="mx-3">
        <Link
          to="/billing"
          className="glass-card block p-3.5 transition hover:border-white/15 hover:bg-white/[0.05]"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold text-white">
              {planName ?? "Free Beta"}
            </span>
            <span className="flex items-center gap-1.5">
              {entitled && (
                <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                  Pro
                </span>
              )}
              <CreditCard className="size-3.5 text-white/45" />
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            <UsageMeter label="Trades logged" used={tradesUsed} limit={tradeLimit} />
            <UpcomingMeter label="AI actions" />
          </div>
        </Link>
      </div>
    </SidebarFooter>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar
      collapsible="icon"
      className="glass-sidebar text-sidebar-foreground [&_[data-sidebar=sidebar]]:bg-transparent"
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarWelcome collapsed={collapsed} />
      <SidebarContent className="px-3 pb-6 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-0 py-2">
            {!collapsed && (
              <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem
                      key={item.url}
                      className={cn(active && "overflow-hidden rounded-xl")}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.soon ? `${item.title} — coming soon` : item.title}
                        className={cn(
                          "h-10 gap-3 px-3 text-[13px] font-medium",
                          active
                            ? "rounded-full"
                            : "rounded-xl text-white/55 hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="size-4 shrink-0" />
                          <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                          {item.soon && !collapsed && (
                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">
                              Soon
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarPlanCard collapsed={collapsed} />
      <ThemeToggle collapsed={collapsed} />
    </Sidebar>
  );
}
