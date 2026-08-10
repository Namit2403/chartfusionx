import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

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

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

export function isSubscriptionActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const notExpired =
    !sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now();
  if (ACTIVE_STATUSES.includes(sub.status)) return notExpired;
  if (sub.status === "canceled") return notExpired;
  return false;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", uid)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
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
      void load(user.id);

      channel = supabase
        .channel(`subscriptions:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscriptions",
            filter: `user_id=eq.${user.id}`,
          },
          () => void load(user.id),
        )
        .subscribe();
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load]);

  return {
    subscription,
    userId,
    email,
    loading,
    isActive: isSubscriptionActive(subscription),
    refresh: () => (userId ? load(userId) : Promise.resolve()),
  };
}
