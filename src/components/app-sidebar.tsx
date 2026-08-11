import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  CreditCard,
  Dna,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  Mic,
  NotebookPen,
  Sparkles,
  Target,
  
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
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Trade Journal", url: "/journal", icon: NotebookPen },
      { title: "Trade Gallery", url: "/gallery", icon: ImageIcon },
      { title: "Playbook", url: "/playbook", icon: BookOpen },
    ],
  },
  {
    label: "AI Systems",
    items: [
      { title: "AI Trade Review", url: "/ai-review", icon: Sparkles },
      { title: "Strategy Discovery", url: "/strategy-discovery", icon: LineChart },
      { title: "Screenshot Reader", url: "/screenshot-reader", icon: Activity },
      { title: "Chart Critique", url: "/chart-critique", icon: Gauge },
      { title: "Voice Summary", url: "/voice-summary", icon: Mic },
      
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Trader DNA", url: "/trader-dna", icon: Dna },
      { title: "Goals & Habits", url: "/goals", icon: Target },
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      
      { title: "Notifications", url: "/notifications", icon: BellRing },
      { title: "Plans & Billing", url: "/billing", icon: CreditCard },
    ],
  },
] as const;

export const coreItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trade Journal", url: "/journal", icon: NotebookPen },
  { title: "AI Trade Review", url: "/ai-review", icon: Sparkles },
  { title: "Trader DNA", url: "/trader-dna", icon: Dna },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
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
            <span className="font-display text-sm font-semibold tracking-tight">
              ChartFusion<span className="text-primary">X</span>
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
                      tooltip={item.title}
                    >
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
