import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";

import { PageHeader, Panel } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "AI Trading Coach — ChartFusionX" },
      {
        name: "description",
        content:
          "A conversational coach trained on your own trading history. Ask why you're losing, what works, and what you repeat.",
      },
      { property: "og:title", content: "AI Trading Coach — ChartFusionX" },
      { property: "og:description", content: "Ask your trading history anything." },
    ],
  }),
  component: Coach,
});

const suggestions = [
  "Why am I losing?",
  "What strategy works best for me?",
  "What mistakes do I repeat?",
  "Show my worst trades.",
  "Find all FOMO trades.",
  "Compare this month vs last month.",
  "When do I perform best?",
  "Which setups should I focus on?",
];

type Msg = { role: "user" | "assistant"; text: string };

const seed: Msg[] = [
  { role: "user", text: "What mistakes do I repeat?" },
  {
    role: "assistant",
    text: "Three patterns repeat across your last 40 trades. First, early entries: 9 of your 14 losses were taken before a confirmation close. Second, early exits — your average winner closes at 1.6R while your targets average 2.6R. Third, size creep after a win: you increase risk by roughly 40% on the trade following a winner, and those trades are net negative.",
  },
];

function Coach() {
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "assistant",
        text: "Connect Lovable Cloud and I'll answer this from your live trade history — for now here's the pattern from your sample data: your Break & Retest setups in the London and Asian sessions carry the entire edge, and everything taken on the 5m during New York is negative.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Module 08"
        title="AI Trading Coach"
        description="A conversational AI trained on your own trading history. It gets more accurate as you log more trades."
      />

      <Panel className="flex h-[26rem] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-background/50 px-4 py-3 text-sm leading-relaxed"
              }
            >
              {m.text}
            </div>
          ))}
        </div>
        <form
          className="mt-4 flex gap-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your trading…"
          />
          <Button type="submit" size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </Panel>

      <Panel title="Try asking">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
