import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Dna,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  Mic,
  NotebookPen,
  Sparkles,
  Rocket,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export const navGroups = [
  {
    label: "Journal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, soon: false },
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trade Journal", url: "/journal", icon: NotebookPen },
  { title: "Trade Gallery", url: "/gallery", icon: ImageIcon },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "What's Coming", url: "/whats-coming", icon: Rocket },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            X
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">
                ChartFusion<span className="text-primary">X</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Free beta
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.soon ? `${item.title} — coming soon` : item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.soon && !collapsed && (
                          <span className="rounded-full border border-border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
