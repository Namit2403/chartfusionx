import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { PaywallDialog } from "@/components/paywall-dialog";
import { SignInGate } from "@/components/sign-in-gate";
import { useAuthUser } from "@/hooks/useAuthUser";

const PAGE_NAMES: Record<string, string> = {
  "/": "your Dashboard",
  "/journal": "your Trade Journal",
  "/journal/new": "trade logging",
  "/gallery": "your Trade Gallery",
  "/playbook": "your Playbook",
  "/ai-review": "AI Trade Review",
  "/strategy-discovery": "Strategy Discovery",
  "/screenshot-reader": "Screenshot Reader",
  "/chart-critique": "Chart Critique",
  "/voice-summary": "Voice Summary",
  
  "/trader-dna": "your Trader DNA",
  "/goals": "Goals & Habits",
  "/reports": "Reports",
  "/analytics": "Analytics",
  "/teams": "Teams",
  "/notifications": "Notifications",
  "/billing": "Plans & Billing",
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuthUser();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (loading) return <div className="min-h-[60vh]" />;

  if (!user) {
    const name = PAGE_NAMES[pathname.replace(/\/$/, "") || "/"] ?? "this page";
    return <SignInGate pageName={name} />;
  }

  return (
    <>
      <Outlet />
      <PaywallDialog />
    </>
  );
}
