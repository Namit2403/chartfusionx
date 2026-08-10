import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { consumeAiAction } from "@/hooks/useSubscription";

/**
 * Wraps an AI action with the server-side entitlement + monthly quota check.
 * Returns false when the action was refused so the caller can bail out.
 */
export function useAiAction(feature: string) {
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const run = useCallback(async () => {
    setChecking(true);
    try {
      const result = await consumeAiAction(feature);
      if (result.ok) return true;

      if (result.reason === "limit-reached") {
        toast.error(
          `You've used all ${result.aiLimit} AI actions in this billing period. Upgrade to Pro for unlimited.`,
          {
            action: { label: "Upgrade", onClick: () => void navigate({ to: "/billing" }) },
          },
        );
      } else {
        toast.error("Your plan isn't active. Start a plan to use the AI tools.", {
          action: { label: "View plans", onClick: () => void navigate({ to: "/billing" }) },
        });
      }
      return false;
    } catch {
      toast.error("Could not verify your AI usage. Please try again.");
      return false;
    } finally {
      setChecking(false);
    }
  }, [feature, navigate]);

  return { run, checking };
}
