import { useState } from "react";

import { getPaddleEnvironment, initializePaddle } from "@/lib/paddle";
import { createCheckoutIntent } from "@/utils/payments.functions";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  /**
   * Opens Paddle checkout. The server decides whether the 7-day trial applies
   * (first plan only) and reuses the existing Paddle customer, so returning
   * members are billed straight away instead of getting another free trial.
   */
  const openCheckout = async (options: {
    priceId: string;
    quantity?: number | undefined;
    customerEmail?: string | undefined;
    customData?: Record<string, string> | undefined;
    successUrl?: string | undefined;
  }): Promise<{ ok: boolean; message: string | null }> => {
    setLoading(true);
    try {
      const intent = await createCheckoutIntent({
        data: { priceId: options.priceId, environment: getPaddleEnvironment() },
      });
      if (!intent.ok) {
        return { ok: false, message: intent.message };
      }

      await initializePaddle();

      const settings = {
        displayMode: "overlay",
        successUrl: options.successUrl || `${window.location.origin}/billing?checkout=success`,
        allowLogout: false,
        variant: "one-page",
      };

      if (intent.mode === "transaction" && intent.transactionId) {
        window.Paddle.Checkout.open({ transactionId: intent.transactionId, settings });
        return { ok: true, message: null };
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: intent.paddlePriceId, quantity: options.quantity ?? 1 }],
        ...(intent.customerId
          ? { customer: { id: intent.customerId } }
          : options.customerEmail
            ? { customer: { email: options.customerEmail } }
            : {}),
        customData: options.customData,
        settings: {
          ...settings,
          // allowLogout may only be false when a customer is supplied.
          allowLogout: !intent.customerId && !options.customerEmail,
        },
      });
      return { ok: true, message: null };
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
