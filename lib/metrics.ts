export type MetricKey =
  | "revenue"
  | "cogs"
  | "adSpend"
  | "profit"
  | "margin"
  | "roas"
  | "cac"
  | "aov";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  description: string;
};

export const METRIC_CATALOG: MetricDefinition[] = [
  {
    key: "revenue",
    label: "Revenue",
    description: "Gross sales from connected store orders.",
  },
  {
    key: "cogs",
    label: "COGS",
    description: "Product costs plus fulfillment and transaction fees.",
  },
  {
    key: "adSpend",
    label: "Ad spend",
    description: "Paid media spend across connected ad accounts.",
  },
  {
    key: "profit",
    label: "True profit",
    description: "Revenue minus COGS, ads, and operating costs.",
  },
  {
    key: "margin",
    label: "Margin",
    description: "True profit as a percentage of revenue.",
  },
  {
    key: "roas",
    label: "ROAS",
    description: "Return on ad spend (revenue / ad spend).",
  },
  {
    key: "cac",
    label: "CAC",
    description: "Customer acquisition cost (ad spend / new customers).",
  },
  {
    key: "aov",
    label: "AOV",
    description: "Average order value.",
  },
];
