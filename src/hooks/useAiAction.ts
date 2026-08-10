import { useCallback, useState } from "react";

import { openPaywall } from "@/components/paywall-dialog";
import { consumeAiAction } from "@/hooks/useSubscription";

/**
 * Wraps an AI action with the server-side entitlement + monthly quota check.
 * Returns false when the action was refused so the caller can bail out.
 */
export function useAiAction(feature: string) {
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    setChecking(true);
    try {
      const result = await consumeAiAction(feature);
      if (result.ok) return true;

      if (result.reason === "limit-reached") {
        openPaywall({
          title: "You've hit your monthly AI limit",
          description: `You've used all ${result.aiLimit} AI actions in this billing period. Upgrade to Pro for unlimited AI reviews, coaching and summaries.`,
        });
      } else {
        openPaywall({
          title: "Unlock the AI tools",
          description:
            "AI reviews, coaching and summaries need an active plan. Both plans include a 7-day free trial — you won't be charged if you cancel before it ends.",
        });
      }
      return false;
    } catch {
      openPaywall({
        title: "Unlock the AI tools",
        description:
          "We couldn't verify your plan. Start a plan to run AI actions, or try again in a moment.",
      });
      return false;
    } finally {
      setChecking(false);
    }
  }, [feature]);

  return { run, checking };
}
