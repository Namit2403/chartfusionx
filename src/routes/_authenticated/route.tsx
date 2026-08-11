import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PaywallDialog } from "@/components/paywall-dialog";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

/**
 * Browsing is open to everyone — the gates live on the actions themselves
 * (logging a trade, running an AI tool), not on the pages.
 */
function AuthenticatedLayout() {
  return (
    <>
      <Outlet />
      <PaywallDialog />
    </>
  );
}
