import { useState } from "react";

import { getPaddlePriceId, initializePaddle } from "@/lib/paddle";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    quantity?: number | undefined;
    customerEmail?: string | undefined;
    customData?: Record<string, string> | undefined;
    successUrl?: string | undefined;
  }) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: options.quantity ?? 1 }],
        ...(options.customerEmail ? { customer: { email: options.customerEmail } } : {}),
        customData: options.customData,
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/billing?checkout=success`,
          // allowLogout may only be false when a customer is supplied.
          allowLogout: !options.customerEmail,
          variant: "one-page",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
