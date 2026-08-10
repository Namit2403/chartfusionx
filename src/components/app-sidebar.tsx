import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  CreditCard,
  Bot,
  ChevronDown,
  Dna,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  Mic,
  NotebookPen,
  Sparkles,
  Target,
  Users,
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

export const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trade Journal", url: "/journal", icon: NotebookPen },
  { title: "AI Trade Review", url: "/ai-review", icon: Sparkles },
  { title: "Trader DNA", url: "/trader-dna", icon: Dna },
  { title: "Coach", url: "/coach", icon: MessageCircle },
];

const moreItems = [
  { title: "Trade Gallery", url: "/gallery", icon: ImageIcon },
  { title: "Playbook", url: "/playbook", icon: BookOpen },
  { title: "Strategy Discovery", url: "/strategy-discovery", icon: LineChart },
  { title: "Screenshot Reader", url: "/screenshot-reader", icon: Activity },
  { title: "Chart Critique", url: "/chart-critique", icon: Gauge },
  { title: "Voice Summary", url: "/voice-summary", icon: Mic },
  { title: "Goals & Habits", url: "/goals", icon: Target },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Notifications", url: "/notifications", icon: BellRing },
  { title: "Plans & billing", url: "/billing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [moreOpen, setMoreOpen] = useState(() =>
    moreItems.some((i) => pathname === i.url),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            X
          </span>
          {!collapsed && (
            <span className="font-display text-sm font-semibold tracking-tight">
              ChartFusion<span className="text-primary">X</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          {!collapsed && <SidebarGroupLabel>More</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setMoreOpen((v) => !v)}
                  tooltip="More"
                  className="flex items-center gap-2"
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${moreOpen ? "" : "-rotate-90"}`}
                  />
                  <span>More tools</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {moreOpen &&
                moreItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
