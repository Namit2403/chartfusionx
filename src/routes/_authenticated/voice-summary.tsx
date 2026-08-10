import { createFileRoute } from "@tanstack/react-router";
import { Download, Pause, Play, RotateCcw, Sparkles, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAiAction } from "@/hooks/useAiAction";
import { PageHeader, Panel, Pill } from "@/components/shell";
import { VoiceOrb } from "@/components/voice-orb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/voice-summary")({
  head: () => ({
    meta: [
      { title: "AI Voice Trading Summary — ChartFusionX" },
      {
        name: "description",
        content:
          "Listen to a weekly or monthly spoken recap of your trading performance, mistakes and goals.",
      },
      { property: "og:title", content: "AI Voice Trading Summary — ChartFusionX" },
      { property: "og:description", content: "Listen to your trading week instead of reading it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VoiceSummary,
});

type Segment = { label: string; text: string };

const scripts: Record<"weekly" | "monthly", { range: string; segments: Segment[] }> = {
  weekly: {
    range: "Week of Aug 3 – Aug 9, 2026",
    segments: [
      { label: "Trades completed", text: "This week you completed 27 trades, six more than last week." },
      { label: "Performance change", text: "You finished up 614 dollars and 75 cents, a 5.2 percent account gain." },
      { label: "Biggest improvement", text: "Your biggest improvement was discipline. Zero revenge trades, down from four." },
      { label: "Biggest mistake", text: "Your biggest mistake was entering breakouts before a confirmation close." },
      { label: "Strategy performance", text: "Break and Retest carried the week with a 2.16 R expectancy across five trades." },
      { label: "Psychology", text: "Your confidence drops sharply after two consecutive losses, and size creeps up after wins." },
      { label: "Next period goal", text: "For next week, cap daily trades at three and log every entry reason before you click buy." },
    ],
  },
  monthly: {
    range: "August 2026 · month to date",
    segments: [
      { label: "Trades completed", text: "This month you completed 96 trades across five markets." },
      { label: "Performance change", text: "You are up 2,404 dollars and 99 cents, a 24 percent account gain." },
      { label: "Biggest improvement", text: "Risk management is your strongest trait this month, scoring 88 out of 100." },
      { label: "Biggest mistake", text: "Momentum trades in the New York session cost you 596 dollars with a zero percent win rate." },
      { label: "Strategy performance", text: "Break and Retest and Swing Continuation produced the entire month's edge." },
      { label: "Psychology", text: "Emotional control slipped four points, driven by trades logged as FOMO or revenge." },
      { label: "Next period goal", text: "Next month, retire the momentum playbook until it is back tested and cut 5 minute entries." },
    ],
  },
};

const estimate = (text: string, rate: number) => (text.split(/\s+/).length / 2.7 / rate) * 1000;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

function VoiceSummary() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [generatedAt, setGeneratedAt] = useState("generated this morning");

  const script = scripts[period];
  const durations = useMemo(
    () => script.segments.map((s) => estimate(s.text, rate)),
    [script, rate],
  );
  const total = useMemo(() => durations.reduce((a, b) => a + b, 0), [durations]);

  const offsets = useMemo(() => {
    let acc = 0;
    return durations.map((d) => {
      const o = acc;
      acc += d;
      return o;
    });
  }, [durations]);

  const activeIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) if (elapsed >= offsets[i]!) idx = i;
    return idx;
  }, [elapsed, offsets]);

  const speak = useCallback(
    (text: string, r: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      if (muted) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = r;
      u.pitch = 0.95;
      window.speechSynthesis.speak(u);
    },
    [muted],
  );

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // master clock
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsed((e) => {
        const next = e + dt;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      setLevel(0.35 + Math.abs(Math.sin(now / 190)) * 0.4 + Math.sin(now / 70) * 0.12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  // speak whichever segment is active
  const spokenRef = useRef<string>("");
  useEffect(() => {
    if (!playing) return;
    const key = `${period}-${activeIndex}-${rate}-${muted}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    speak(script.segments[activeIndex]!.text, rate);
  }, [playing, activeIndex, period, rate, muted, script, speak]);

  useEffect(() => {
    if (!playing) {
      stopSpeech();
      spokenRef.current = "";
      setLevel(0);
    }
  }, [playing, stopSpeech]);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const seekTo = (index: number) => {
    const clamped = Math.min(script.segments.length - 1, Math.max(0, index));
    spokenRef.current = "";
    setElapsed(offsets[clamped]! + 1);
  };

  const switchPeriod = (p: "weekly" | "monthly") => {
    setPeriod(p);
    setElapsed(0);
    setPlaying(false);
    spokenRef.current = "";
  };

  const download = () => {
    const body = [
      `ChartFusionX — AI Voice Trading Summary`,
      script.range,
      "",
      ...script.segments.map((s) => `${s.label.toUpperCase()}\n${s.text}\n`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `chartfusionx-${period}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { run: spendAiAction, checking: regenerating } = useAiAction("voice-summary");

  const regenerate = async () => {
    if (!(await spendAiAction())) return;
    setPlaying(false);
    setElapsed(0);
    spokenRef.current = "";
    setGeneratedAt(
      `regenerated ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    );
  };

  const progress = total ? Math.min(100, (elapsed / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 07"
        title="AI Voice Trading Summary"
        description="A personal assistant that narrates your weekly and monthly performance so you can review on the move."
        action={
          <div className="flex gap-2">
            {(["weekly", "monthly"] as const).map((p) => (
              <button key={p} onClick={() => switchPeriod(p)} className="capitalize">
                <Pill tone={period === p ? "accent" : "neutral"}>{p}</Pill>
              </button>
            ))}
          </div>
        }
      />

      <Panel className="relative overflow-hidden border-viz/20 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--viz)_9%,transparent),transparent_70%)] p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="mx-auto w-full">
            <VoiceOrb
              active={playing}
              level={level}
              playing={playing}
              onToggle={() => setPlaying((p) => !p)}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-viz">
              {playing ? "Now speaking" : "Ready to play"}
            </div>
            <h2 className="mt-2 text-xl font-semibold">{script.range}</h2>
            <p className="mt-4 min-h-[4.5rem] text-sm leading-relaxed text-foreground/90">
              <span className="text-viz">{script.segments[activeIndex]!.label}: </span>
              {script.segments[activeIndex]!.text}
            </p>

            <div
              role="slider"
              tabIndex={0}
              aria-label="Seek summary"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") seekTo(activeIndex + 1);
                if (e.key === "ArrowLeft") seekTo(activeIndex - 1);
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - r.left) / r.width;
                spokenRef.current = "";
                setElapsed(Math.max(0, Math.min(total - 1, ratio * total)));
              }}
              className="mt-5 cursor-pointer py-2"
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-viz transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span className="num">{fmt(elapsed)}</span>
                <span>{generatedAt}</span>
                <span className="num">{fmt(total)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Previous section" onClick={() => seekTo(activeIndex - 1)}>
                <SkipBack className="size-4" />
              </Button>
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {playing ? "Pause" : "Play summary"}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next section" onClick={() => seekTo(activeIndex + 1)}>
                <SkipForward className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Restart" onClick={() => { setElapsed(0); spokenRef.current = ""; }}>
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={muted ? "Unmute voice" : "Mute voice"}
                onClick={() => {
                  setMuted((m) => !m);
                  stopSpeech();
                  spokenRef.current = "";
                }}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <div className="flex overflow-hidden rounded-full border border-border">
                {[1, 1.25, 1.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRate(r);
                      spokenRef.current = "";
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs transition-colors",
                      rate === r ? "bg-viz/15 text-viz" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Transcript" subtitle="Click any line to jump the narration there.">
        <div className="divide-y divide-border">
          {script.segments.map((s, i) => (
            <button
              key={s.label}
              onClick={() => seekTo(i)}
              className={cn(
                "flex w-full flex-wrap gap-2 py-3 text-left text-sm transition-colors",
                i === activeIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "w-48 shrink-0 text-[11px] uppercase tracking-[0.12em]",
                  i === activeIndex ? "text-viz" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              <span className="min-w-0 flex-1">{s.text}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={download}>
            <Download className="size-4" /> Download transcript
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void regenerate()} disabled={regenerating}>
            <Sparkles className="size-4" /> Regenerate
          </Button>
        </div>
      </Panel>
    </div>
  );
}
