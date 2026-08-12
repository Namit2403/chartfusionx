import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Pause, Play, RotateCcw, Sparkles, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { useAiAction } from "@/hooks/useAiAction";
import { useTradeData } from "@/hooks/useTradeData";
import { NoTradesYet } from "@/components/no-trades-yet";
import { synthesizeSummary } from "@/lib/tts.functions";
import { PageHeader, Panel, Pill } from "@/components/shell";
import { VoiceOrb } from "@/components/voice-orb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RiskDisclaimer } from "@/components/risk-disclaimer";

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
type Period = "weekly" | "monthly";

const money = (n: number) =>
  `${n < 0 ? "down " : "up "}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} dollars`;

const fmt = (s: number) => {
  const total = Math.max(0, Math.round(s));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
};

function VoiceSummary() {
  const { trades, stats, strategyPerf, sessionPerf, isEmpty, loading } = useTradeData();
  const [period, setPeriod] = useState<Period>("weekly");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [level, setLevel] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("not generated yet");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speak = useServerFn(synthesizeSummary);
  const { run: spendAiAction, checking } = useAiAction("voice-summary");

  const script = useMemo(() => {
    const windowDays = period === "weekly" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const scoped = trades.filter((t) => new Date(t.date) >= cutoff);
    const pnl = scoped.reduce((s, t) => s + t.pnl, 0);
    const wins = scoped.filter((t) => t.pnl > 0).length;
    const winRate = scoped.length ? Math.round((wins / scoped.length) * 100) : 0;
    const bestStrategy = [...strategyPerf].sort((a, b) => b.expectancy - a.expectancy)[0];
    const worstStrategy = [...strategyPerf].sort((a, b) => a.pnl - b.pnl)[0];
    const bestSession = [...sessionPerf].sort((a, b) => b.pnl - a.pnl)[0];
    const lessons = scoped.find((t) => t.note)?.note;

    const segments: Segment[] = [
      {
        label: "Trades completed",
        text: `In the last ${windowDays} days you completed ${scoped.length} trade${scoped.length === 1 ? "" : "s"}, with a ${winRate} percent win rate.`,
      },
      {
        label: "Performance change",
        text: `Across that window you finished ${money(pnl)}, and your all time logged result stands ${money(stats.totalPnl)}.`,
      },
      {
        label: "Risk profile",
        text: `Your average risk per trade is ${stats.avgRiskPct.toFixed(2)} percent, with an average return of ${stats.avgR.toFixed(2)} R and a profit factor of ${stats.profitFactor.toFixed(2)}.`,
      },
      {
        label: "Strategy performance",
        text: bestStrategy
          ? `Your strongest strategy is ${bestStrategy.name}, averaging ${bestStrategy.expectancy.toFixed(2)} R across ${bestStrategy.trades} trades.`
          : "You have not logged enough trades yet for a strategy breakdown.",
      },
      {
        label: "Biggest drag",
        text:
          worstStrategy && worstStrategy.pnl < 0
            ? `${worstStrategy.name} is your biggest drag, costing you ${Math.abs(worstStrategy.pnl).toFixed(2)} dollars so far.`
            : "No strategy is currently losing money for you, which is a good place to build from.",
      },
      {
        label: "Best session",
        text: bestSession
          ? `The ${bestSession.name} session is your most profitable window, with a ${Math.round(bestSession.winRate)} percent win rate.`
          : "Log the session for each trade and I will tell you when you trade best.",
      },
      {
        label: "Next period goal",
        text: lessons
          ? `Your own note to yourself was: ${lessons}. Carry that into the coming week.`
          : `Keep your risk near ${Math.max(0.25, stats.avgRiskPct).toFixed(2)} percent and write a lesson on every trade so the next summary is sharper.`,
      },
    ];

    const rangeLabel =
      period === "weekly"
        ? `Last 7 days · ${scoped.length} trades`
        : `Last 30 days · ${scoped.length} trades`;

    return { range: rangeLabel, segments };
  }, [period, trades, stats, strategyPerf, sessionPerf]);

  const fullText = useMemo(() => script.segments.map((s) => s.text).join(" "), [script]);

  // Character offsets let us map audio position onto the transcript.
  const offsets = useMemo(() => {
    let acc = 0;
    const total = fullText.length || 1;
    return script.segments.map((s) => {
      const start = acc / total;
      acc += s.text.length + 1;
      return start;
    });
  }, [script, fullText]);

  const progressRatio = duration ? elapsed / duration : 0;
  const activeIndex = useMemo(() => {
    let idx = 0;
    offsets.forEach((o, i) => {
      if (progressRatio >= o) idx = i;
    });
    return idx;
  }, [offsets, progressRatio]);

  // Any change to the script invalidates the rendered audio.
  useEffect(() => {
    setAudioSrc(null);
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
  }, [fullText]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, audioSrc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted, audioSrc]);

  // Orb animation while audio plays.
  useEffect(() => {
    if (!playing) {
      setLevel(0);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      setLevel(0.35 + Math.abs(Math.sin(now / 190)) * 0.4 + Math.sin(now / 70) * 0.12);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  async function generate(): Promise<string | null> {
    if (!(await spendAiAction())) return null;
    setGenerating(true);
    try {
      const { audio, mimeType } = await speak({ data: { text: fullText } });
      const src = `data:${mimeType};base64,${audio}`;
      setAudioSrc(src);
      setGeneratedAt(
        `generated ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      );
      return src;
    } catch (err) {
      console.error("voice summary generation failed", err);
      toast.error("We couldn't generate the narration. Try again in a moment.");
      return null;
    } finally {
      setGenerating(false);
    }
  }

  async function togglePlay() {
    const el = audioRef.current;
    if (playing) {
      el?.pause();
      setPlaying(false);
      return;
    }
    if (!audioSrc) {
      const src = await generate();
      if (!src) return;
      // wait for the element to pick up the new source
      requestAnimationFrame(() => {
        void audioRef.current?.play();
      });
      return;
    }
    void el?.play();
  }

  function seekToSegment(index: number) {
    const el = audioRef.current;
    const clamped = Math.min(script.segments.length - 1, Math.max(0, index));
    if (!el || !duration) return;
    el.currentTime = (offsets[clamped] ?? 0) * duration;
  }

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

  const header = (
    <PageHeader
      eyebrow="Module 07"
      title="AI Voice Trading Summary"
      description="A personal assistant that narrates your weekly and monthly performance so you can review on the move."
      action={
        <div className="flex gap-2">
          {(["weekly", "monthly"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="capitalize">
              <Pill tone={period === p ? "accent" : "neutral"}>{p}</Pill>
            </button>
          ))}
        </div>
      }
    />

      <RiskDisclaimer />
  );

  if (!loading && isEmpty) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {header}
        <NoTradesYet
          title="Nothing to narrate yet"
          description="Your voice summary is built from your own logged trades. Log a few and come back to hear the recap."
        />
      </div>
    );
  }

  const busy = generating || checking;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {header}

      <audio
        ref={audioRef}
        {...(audioSrc ? { src: audioSrc } : {})}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          el.playbackRate = rate;
          el.muted = muted;
          if (Number.isFinite(el.duration)) setDuration(el.duration);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setElapsed(el.currentTime);
          if (Number.isFinite(el.duration) && el.duration !== duration) setDuration(el.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <Panel className="relative overflow-hidden border-viz/20 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--viz)_9%,transparent),transparent_70%)] p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="mx-auto w-full">
            <VoiceOrb
              active={playing}
              level={level}
              playing={playing}
              onToggle={() => void togglePlay()}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-viz">
              {generating ? "Generating narration" : playing ? "Now speaking" : "Ready to play"}
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
              aria-valuenow={Math.round(progressRatio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") seekToSegment(activeIndex + 1);
                if (e.key === "ArrowLeft") seekToSegment(activeIndex - 1);
              }}
              onClick={(e) => {
                const el = audioRef.current;
                if (!el || !duration) return;
                const r = e.currentTarget.getBoundingClientRect();
                el.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
              }}
              className="mt-5 cursor-pointer py-2"
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-viz transition-[width] duration-100"
                  style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span className="num">{fmt(elapsed)}</span>
                <span>{generatedAt}</span>
                <span className="num">{fmt(duration)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Previous section" onClick={() => seekToSegment(activeIndex - 1)}>
                <SkipBack className="size-4" />
              </Button>
              <Button size="lg" className="rounded-full px-6" onClick={() => void togglePlay()} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {busy ? "Generating…" : playing ? "Pause" : audioSrc ? "Play summary" : "Generate & play"}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next section" onClick={() => seekToSegment(activeIndex + 1)}>
                <SkipForward className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Restart"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={muted ? "Unmute voice" : "Mute voice"}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <div className="flex overflow-hidden rounded-full border border-border">
                {[1, 1.25, 1.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(r)}
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
              onClick={() => seekToSegment(i)}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAudioSrc(null);
              void generate();
            }}
            disabled={busy}
          >
            <Sparkles className="size-4" /> Regenerate
          </Button>
        </div>
      </Panel>
    </div>
  );
}
