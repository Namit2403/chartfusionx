import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

import { EmptyHint, PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/journal/new")({
  head: () => ({
    meta: [
      { title: "Log a Trade — ChartFusionX" },
      {
        name: "description",
        content:
          "Record entry, exit, risk, market context, psychology, tags and attachments for a single trade.",
      },
      { property: "og:title", content: "Log a Trade — ChartFusionX" },
      {
        property: "og:description",
        content: "Capture the full context of every trade so the AI can coach you accurately.",
      },
    ],
  }),
  component: NewTrade,
});

const TAGS = [
  "A+ Setup",
  "FOMO",
  "Revenge Trade",
  "News Trade",
  "Scalping",
  "Swing",
  "Breakout",
  "Reversal",
  "High Confidence",
  "Experimental",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Picker({ label, options }: { label: string; options: string[] }) {
  return (
    <Field label={label}>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function NewTrade() {
  const [selected, setSelected] = useState<string[]>(["A+ Setup"]);
  const [confidence, setConfidence] = useState([7]);
  const { isActive, loading: subLoading } = useSubscription();

  function requirePlan() {
    if (isActive) return true;
    openPaywall({
      title: "Start your trial to log trades",
      description:
        "Journaling trades needs an active plan. Both plans include a 7-day free trial — you won't be charged if you cancel before it ends.",
    });
    return false;
  }

  function saveTrade() {
    if (!requirePlan()) return;
    toast.success("Trade saved — AI review queued");
  }

  function saveDraft() {
    if (!requirePlan()) return;
    toast.success("Draft saved");
  }



  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Trade logging"
        title="Log a trade"
        description="The more context you capture, the sharper your AI trade review becomes."
      />

      <Panel title="Basic trade information">
        <div className="grid gap-4 sm:grid-cols-3">
          <Picker label="Market" options={["Forex", "Crypto", "Stocks", "Futures", "Options"]} />
          <Field label="Asset">
            <Input placeholder="EURUSD" />
          </Field>
          <Field label="Broker">
            <Input placeholder="IC Markets" />
          </Field>
          <Picker label="Account type" options={["Live", "Demo", "Prop Challenge", "Funded"]} />
          <Field label="Account size">
            <Input placeholder="10000" inputMode="decimal" />
          </Field>
          <Field label="Setup name">
            <Input placeholder="London break & retest" />
          </Field>
          <Picker label="Strategy" options={["Break & Retest", "Momentum", "Reversal", "Swing Continuation", "News Play"]} />
          <Picker label="Direction" options={["Long", "Short"]} />
          <Picker label="Timeframe" options={["1m", "5m", "15m", "30m", "1h", "4h", "1D"]} />
        </div>
      </Panel>

      <Panel title="Entry & exit data">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Entry price"><Input inputMode="decimal" placeholder="1.0842" /></Field>
          <Field label="Exit price"><Input inputMode="decimal" placeholder="1.0891" /></Field>
          <Field label="Stop loss"><Input inputMode="decimal" placeholder="1.0820" /></Field>
          <Field label="Take profit"><Input inputMode="decimal" placeholder="1.0905" /></Field>
          <Field label="Position size"><Input inputMode="decimal" placeholder="1.0 lot" /></Field>
          <Field label="Risk %"><Input inputMode="decimal" placeholder="0.75" /></Field>
          <Field label="Reward %"><Input inputMode="decimal" placeholder="2.25" /></Field>
          <Field label="Fees / commissions"><Input inputMode="decimal" placeholder="4.20" /></Field>
          <Field label="Trade duration"><Input placeholder="1h 40m" /></Field>
        </div>
        <EmptyHint>
          P&amp;L, R multiple, risk-reward, expectancy and drawdown are calculated automatically once
          the trade is saved.
        </EmptyHint>
      </Panel>

      <Panel title="Trading context">
        <div className="grid gap-4 sm:grid-cols-3">
          <Picker label="Session" options={["Asian", "London", "New York"]} />
          <Picker label="Day of week" options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]} />
          <Picker label="Market conditions" options={["Trending", "Ranging", "Volatile", "Thin liquidity", "News driven"]} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Before the trade" subtitle="Psychology at entry">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Confidence level</Label>
              <div className="mt-3 flex items-center gap-4">
                <Slider value={confidence} onValueChange={setConfidence} min={1} max={10} step={1} />
                <span className="num w-8 text-right text-sm">{confidence[0]}</span>
              </div>
            </div>
            <Picker label="Emotion" options={["Calm", "Fear", "Greed", "FOMO", "Revenge"]} />
            <Field label="Reason for entry">
              <Textarea rows={3} placeholder="What made this a valid setup?" />
            </Field>
          </div>
        </Panel>

        <Panel title="After the trade" subtitle="Psychology at exit">
          <div className="space-y-4">
            <Picker label="Emotional state" options={["Calm", "Satisfied", "Frustrated", "Angry", "Regretful", "Proud"]} />
            <Field label="Mistakes made">
              <Textarea rows={3} placeholder="Entered before confirmation…" />
            </Field>
            <Field label="Lessons learned">
              <Textarea rows={3} placeholder="Wait for the candle close next time." />
            </Field>
          </div>
        </Panel>
      </div>

      <Panel title="Tags" subtitle="Categorize the trade for later filtering and AI pattern detection">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelected((s) => (active ? s.filter((x) => x !== tag) : [...s, tag]))
                }
                className={
                  active
                    ? "rounded-full border border-primary bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                    : "rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Attachments" subtitle="Charts, screenshots, videos, voice notes, plans — all searchable by AI">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Before-trade chart", "After-trade chart", "Voice note / video / PDF"].map((slot) => (
            <div
              key={slot}
              className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/40 text-center text-xs text-muted-foreground"
            >
              <Paperclip className="size-4" />
              {slot}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pill tone="accent">Uploads become AI-readable context</Pill>
        </div>
      </Panel>

      <div className="flex justify-end gap-2 pb-4">
        <Button variant="secondary" onClick={saveDraft}>
          Save draft
        </Button>
        <Button onClick={saveTrade} disabled={subLoading}>
          Save trade
        </Button>
      </div>

    </div>
  );
}
