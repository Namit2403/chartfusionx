import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, RotateCcw } from "lucide-react";

import { EmptyHint, PageHeader, Panel, Pill } from "@/components/shell";
import { openPaywall } from "@/components/paywall-dialog";
import { useSubscription } from "@/hooks/useSubscription";
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

const DRAFT_KEY = "chartfusionx.trade-draft.v1";

type Draft = {
  fields: Record<string, string>;
  tags: string[];
  confidence: number;
};

const EMPTY_DRAFT: Draft = { fields: {}, tags: ["A+ Setup"], confidence: 7 };

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      fields: parsed.fields ?? {},
      tags: parsed.tags ?? EMPTY_DRAFT.tags,
      confidence: parsed.confidence ?? EMPTY_DRAFT.confidence,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function hasContent(draft: Draft) {
  return Object.values(draft.fields).some((v) => v.trim().length > 0);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NewTrade() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);
  const { isActive, loading: subLoading } = useSubscription();

  // Restore whatever was typed before the paywall / upgrade detour.
  useEffect(() => {
    const saved = readDraft();
    setDraft(saved);
    if (hasContent(saved)) setRestored(true);
    hydrated.current = true;
  }, []);

  // Keep the draft persisted on every keystroke so nothing is lost when the
  // user leaves for billing (or reloads mid-entry).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable — draft simply isn't persisted */
    }
  }, [draft]);

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));

  function clearDraft() {
    setDraft(EMPTY_DRAFT);
    setRestored(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  function requirePlan() {
    if (isActive) return true;
    openPaywall({
      title: "Start your trial to log trades",
      description:
        "Journaling trades needs an active plan. Your draft is saved on this device, so you can pick up exactly where you left off after choosing a plan.",
    });
    return false;
  }

  function saveTrade() {
    if (!requirePlan()) return;
    toast.success("Trade saved — AI review queued");
    clearDraft();
  }

  function saveDraft() {
    if (!requirePlan()) return;
    toast.success("Draft saved");
  }

  function TextField({
    label,
    name,
    placeholder,
    decimal,
  }: {
    label: string;
    name: string;
    placeholder?: string;
    decimal?: boolean;
  }) {
    return (
      <Field label={label}>
        <Input
          {...(placeholder ? { placeholder } : {})}
          {...(decimal ? { inputMode: "decimal" as const } : {})}
          value={draft.fields[name] ?? ""}
          onChange={(e) => setField(name, e.target.value)}
        />
      </Field>
    );
  }

  function Picker({ label, name, options }: { label: string; name: string; options: string[] }) {
    return (
      <Field label={label}>
        <Select value={draft.fields[name] ?? ""} onValueChange={(v) => setField(name, v)}>
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

  function AreaField({
    label,
    name,
    placeholder,
  }: {
    label: string;
    name: string;
    placeholder: string;
  }) {
    return (
      <Field label={label}>
        <Textarea
          rows={3}
          placeholder={placeholder}
          value={draft.fields[name] ?? ""}
          onChange={(e) => setField(name, e.target.value)}
        />
      </Field>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Trade logging"
        title="Log a trade"
        description="The more context you capture, the sharper your AI trade review becomes."
      />

      {restored && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            We restored your unsaved draft from this device.
          </span>
          <Button size="sm" variant="ghost" onClick={clearDraft}>
            <RotateCcw className="size-3.5" />
            Start fresh
          </Button>
        </div>
      )}

      <Panel title="Basic trade information">
        <div className="grid gap-4 sm:grid-cols-3">
          <Picker label="Market" name="market" options={["Forex", "Crypto", "Stocks", "Futures", "Options"]} />
          <TextField label="Asset" name="asset" placeholder="EURUSD" />
          <TextField label="Broker" name="broker" placeholder="IC Markets" />
          <Picker label="Account type" name="accountType" options={["Live", "Demo", "Prop Challenge", "Funded"]} />
          <TextField label="Account size" name="accountSize" placeholder="10000" decimal />
          <TextField label="Setup name" name="setup" placeholder="London break & retest" />
          <Picker
            label="Strategy"
            name="strategy"
            options={["Break & Retest", "Momentum", "Reversal", "Swing Continuation", "News Play"]}
          />
          <Picker label="Direction" name="direction" options={["Long", "Short"]} />
          <Picker label="Timeframe" name="timeframe" options={["1m", "5m", "15m", "30m", "1h", "4h", "1D"]} />
        </div>
      </Panel>

      <Panel title="Entry & exit data">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Entry price" name="entry" placeholder="1.0842" decimal />
          <TextField label="Exit price" name="exit" placeholder="1.0891" decimal />
          <TextField label="Stop loss" name="stop" placeholder="1.0820" decimal />
          <TextField label="Take profit" name="target" placeholder="1.0905" decimal />
          <TextField label="Position size" name="size" placeholder="1.0 lot" decimal />
          <TextField label="Risk %" name="risk" placeholder="0.75" decimal />
          <TextField label="Reward %" name="reward" placeholder="2.25" decimal />
          <TextField label="Fees / commissions" name="fees" placeholder="4.20" decimal />
          <TextField label="Trade duration" name="duration" placeholder="1h 40m" />
        </div>
        <EmptyHint>
          P&amp;L, R multiple, risk-reward, expectancy and drawdown are calculated automatically once
          the trade is saved.
        </EmptyHint>
      </Panel>

      <Panel title="Trading context">
        <div className="grid gap-4 sm:grid-cols-3">
          <Picker label="Session" name="session" options={["Asian", "London", "New York"]} />
          <Picker
            label="Day of week"
            name="day"
            options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}
          />
          <Picker
            label="Market conditions"
            name="conditions"
            options={["Trending", "Ranging", "Volatile", "Thin liquidity", "News driven"]}
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Before the trade" subtitle="Psychology at entry">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Confidence level</Label>
              <div className="mt-3 flex items-center gap-4">
                <Slider
                  value={[draft.confidence]}
                  onValueChange={(v) => setDraft((d) => ({ ...d, confidence: v[0] ?? d.confidence }))}
                  min={1}
                  max={10}
                  step={1}
                />
                <span className="num w-8 text-right text-sm">{draft.confidence}</span>
              </div>
            </div>
            <Picker label="Emotion" name="emotionBefore" options={["Calm", "Fear", "Greed", "FOMO", "Revenge"]} />
            <AreaField
              label="Reason for entry"
              name="reason"
              placeholder="What made this a valid setup?"
            />
          </div>
        </Panel>

        <Panel title="After the trade" subtitle="Psychology at exit">
          <div className="space-y-4">
            <Picker
              label="Emotional state"
              name="emotionAfter"
              options={["Calm", "Satisfied", "Frustrated", "Angry", "Regretful", "Proud"]}
            />
            <AreaField
              label="Mistakes made"
              name="mistakes"
              placeholder="Entered before confirmation…"
            />
            <AreaField
              label="Lessons learned"
              name="lessons"
              placeholder="Wait for the candle close next time."
            />
          </div>
        </Panel>
      </div>

      <Panel title="Tags" subtitle="Categorize the trade for later filtering and AI pattern detection">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = draft.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    tags: active ? d.tags.filter((x) => x !== tag) : [...d.tags, tag],
                  }))
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

      <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
        <span className="mr-auto text-xs text-muted-foreground">
          Draft autosaves on this device — nothing is lost if you step out to upgrade.
        </span>
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
