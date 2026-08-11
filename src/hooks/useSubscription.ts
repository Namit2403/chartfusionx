import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  getBillingOverview,
  recordAiUsage,
  recordTradeLog,
} from "@/utils/payments.functions";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  created_at: string;
};

export type PaymentTransaction = {
  id: string;
  paddle_transaction_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  billed_at: string;
  refunded_cents: number;
};

export type BillingOverview = {
  subscription: SubscriptionRow | null;
  entitled: boolean;
  planId: string | null;
  planName: string | null;
  aiUsed: number;
  aiLimit: number | null;
  aiRemaining: number | null;
  tradesUsed: number;
  tradeLimit: number | null;
  tradesRemaining: number | null;
  transactions: PaymentTransaction[];
};

const EMPTY: BillingOverview = {
  subscription: null,
  entitled: false,
  planId: null,
  planName: null,
  aiUsed: 0,
  aiLimit: null,
  aiRemaining: null,
  tradesUsed: 0,
  tradeLimit: null,
  tradesRemaining: null,
  transactions: [],
};

export function useSubscription() {
  const [overview, setOverview] = useState<BillingOverview>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getBillingOverview({
        data: { environment: getPaddleEnvironment() },
      });
      setOverview(result as unknown as BillingOverview);
    } catch {
      setOverview(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? null);
      void load();

      channel = supabase
        .channel(`subscriptions:${user.id}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscriptions",
            filter: `user_id=eq.${user.id}`,
          },
          () => void load(),
        )
        .subscribe();
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load]);

  return {
    ...overview,
    subscription: overview.subscription,
    userId,
    email,
    loading,
    isActive: overview.entitled,
    refresh: load,
  };
}

/**
 * Runs an AI action through the server-side entitlement + quota check.
 * Returns false when the action was refused, so callers can show a paywall.
 */
export async function consumeAiAction(feature: string) {
  return recordAiUsage({
    data: { feature, environment: getPaddleEnvironment() },
  }) as Promise<{ ok: boolean; reason: string; aiUsed: number; aiLimit: number | null }>;
}
