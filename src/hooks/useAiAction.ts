import { useCallback, useState } from "react";

import { openPaywall, openSignInPrompt } from "@/components/paywall-dialog";
import { consumeAiAction } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps an AI action with the sign-in check plus the server-side entitlement
 * and monthly quota check. Returns false when the action was refused.
 */
export function useAiAction(feature: string) {
  const [checking, setChecking] = useState(false);

  const run = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        openSignInPrompt({
          title: "Sign in to use the AI tools",
          description:
            "Look around as much as you like — running AI reviews, critiques and summaries needs an account so the results are saved to you.",
        });
        return false;
      }

      const result = await consumeAiAction(feature);
      if (result.ok) return true;

      if (result.reason === "limit-reached") {
        openPaywall({
          title: "You've hit your monthly AI limit",
          description: `You've used all ${result.aiLimit} AI actions in this billing period. Upgrade to Pro for unlimited AI reviews and summaries.`,
        });
      } else {
        openPaywall({
          title: "AI tools need a plan",
          description:
            "The free account covers journaling your first trades. AI reviews, critiques and summaries are part of Starter and Pro — both include a 7-day free trial.",
        });
      }
      return false;
    } catch {
      openPaywall({
        title: "AI tools need a plan",
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
