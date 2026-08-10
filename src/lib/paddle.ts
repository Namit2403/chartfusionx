import { resolvePaddlePrice } from "@/utils/payments.functions";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

export type PlanId = "starter_monthly" | "pro_monthly";

export const PLANS = [
  {
    priceId: "starter_monthly" as PlanId,
    productId: "starter_plan",
    name: "Starter",
    price: 29,
    tagline: "For traders building the habit.",
    features: [
      "Smart trading journal + trade gallery",
      "Performance dashboard & equity curve",
      "AI trade review on every entry",
      "Trader DNA behavioural profile",
      "Goals & habit tracking",
    ],
  },
  {
    priceId: "pro_monthly" as PlanId,
    productId: "pro_plan",
    name: "Pro",
    price: 69,
    tagline: "For traders scaling an edge.",
    features: [
      "Everything in Starter",
      "AI strategy discovery & chart critique",
      "AI screenshot reader & voice summaries",
      "AI trading coach with weekly plans",
      "Advanced reports, analytics & exports",
      "Teams & mentorship workspaces",
    ],
  },
] as const;

export function getPaddleEnvironment(): "sandbox" | "live" {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

let paddleInitialized = false;

export async function initializePaddle() {
  if (paddleInitialized) return;

  if (!clientToken) {
    throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const paddleJsEnvironment =
        getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnvironment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const environment = getPaddleEnvironment();
  return resolvePaddlePrice({ data: { priceId, environment } });
}
