<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project & environment quirks

- Dev server binds **port 8080**, not 5173 — the `@lovable.dev` Vite preset overrides the default. URL: `http://localhost:8080/`.
- Vite client env vars need the `VITE_` prefix (default `envPrefix`, no override in the preset config): `import.meta.env.FOO` is always undefined unless the var is `VITE_FOO`. Founding-CTA flag: `VITE_FOUNDER_CTA_LIVE` (see `src/lib/whop-founding.ts`); test flag branches by deleting/setting the key on `import.meta.env` + `vi.resetModules()` before a dynamic import.
- Pre-existing benign console noise: a `<html>` hydration warning from `__root.tsx` only (the old external-font 404 was fixed by deleting the unused Bowlby One `@font-face`). Don't chase the hydration warning.
- `code_search` intermittently fails with a ripgrep ENOENT (uv_spawn) error; retrying the identical call usually works.

## Running & testing

- No `test` script in package.json — run `npx vitest run` (jsdom + testing-library, setup in `src/test/setup.ts`). Typecheck: `npx tsc --noEmit`. Lint: `npx eslint <files> --fix`.
- To test a TanStack file-route component, mock `@tanstack/react-router` (`createFileRoute` → identity fn, `Link` → `<a>`), dynamically import the route module, and use `(Route as any).component`. See `src/routes/_authenticated/app.dashboard.test.tsx`.
- Dashboard P&L renders on both the stat card and the trade card, so tests need `getAllByText` for money/percent strings.
- Landing visual identity ("dark cinematic slides", 2026-09, replaced the Trader's Ledger look): steel-blue gradient page ground with rounded near-black starfield slides (`.lp-*` utilities in styles.css: slide, stars, beam, glowtext, card, card-hot, btn-primary/ghost, navlink, tag, marquee). Live features = glowing-edge glass cards (`.lp-card-hot`), roadmap = quiet glass; Pro pricing card glows. H1 is a gradient-glow wordmark. Hero session chart is an explicitly-labeled illustrative SVG — keep the "not real data" caption if edited. No user-count or metric claims may be added (no-fabrication rule); mockup stats like "+15K users" are forbidden.
- App shell "night cockpit" (2026-09): `.app-sky` night-sky ground + `.app-cockpit` rounded panel wrap the authenticated app in `__root.tsx`; header is a floating liquid-glass pill (`.liquid-bar`, specular streak ::before). Sidebar (`.glass-sidebar` tokens) is deep navy, floating with 28px radius on desktop (margin via media query ≥768px — keep the mobile sheet full-bleed). Active nav item = white circular pill with dark ink; overriding the sidebar primitive's data-active variant needs `!bg-white !text-[#0b1020]` (plain utilities lose the cascade). Dashboard headline gradients "Welcome back". Dashboard surfaces use `.glass` (aurora `.glass-mesh` in app.tsx); add `.gloss` with `--gloss-from/--gloss-to/--gloss-glow` RGB variables for the tinted glowing variant (dashboard `Card` takes a `gloss={[r,g,b]×3}` prop). New shell surfaces should reuse these classes, not bespoke borders/shadows.
- Buttons are liquid-glass capsules: shared `.glass-btn` (glossy dark capsule, bright 1px edge, top sheen, colored under-glow via `--btn-glow`) baked into `ui/button.tsx` variants — ghost/link strip it with `!bg-none !shadow-none !border-transparent`. Landing primaries use `.lp-btn-primary` (same anatomy, blue tint). New buttons: just use `Button`/`.lp-btn-*`; recolor via a `--btn-glow` class like `.btn-glow-red`, never bespoke shadows.
- Dashboard layout history (2026-09): the "no-scroll cockpit board" restructure (fixed flex budget, pinned grid rows, footer bar) was REVERTED by user request — "go back to the old dashboard layout pls this looks terrible". The dashboard is the classic scrollable page again: stat-card row (4× StatCard with gloss + spark), equity chart + right rail (MiniCalendar/GoalRing/SessionCountdowns), quick-stats tile bar, RecentTradeCard grid, Top setups pie, RiskDisclaimer card. If a fit-without-scroll pass is ever retried, the Helios version is preserved at `.freebuff/backups/app.tsx.helios` and its flex recipe is: main `overflow-y-auto min-h-0` in a fixed-height shell, grid `lg:grid-rows-[minmax(0,1fr)]` to pin rows, definite height on the recharts container (`ResponsiveContainer` collapses in auto-height flex parents). Verify layout with preview_evaluate (`main.scrollHeight - main.clientHeight`), NOT preview_screenshot — the webview can serve stale frames after HMR.
- Daylight theme: every dark-tuned surface needs a `:root:not(.dark)` override (existing blocks in styles.css: `.glass-sidebar` text remaps, `.glass` white fill + pastel→dark text remaps, `.app-sky/.app-cockpit`, active nav pill flips to ink-black). Any new dark-tuned class MUST ship its light variant in the same PR — pastel-300 text and white pills are invisible on white glass. Do NOT use Tailwind `!important` utilities (`!bg-white`) for themed styles: layered !important beats unlayered !important in the cascade — own the style in unlayered CSS per theme instead. Exception: overriding an UNLAYERED rule inside a component's own base class (e.g. `.glass-btn`'s `color:#ffffff` vs a variant's text color) needs the layered-important form (`!text-foreground`). Header ghost buttons resolve via `text-foreground` (white on dark glass in dark theme, ink on the white frost in daylight).

## Freebuff preview webview (this environment)

- The "This page didn't load / Something went wrong on our end" error frame usually is NOT a dead server: the server often answers HTTP 200 the whole time (verify with curl first). Real causes seen: (1) a JSX syntax error mid-edit that fixed itself moments later — a reload clears it; (2) the webview latching onto a broken HMR frame and never retrying; (3) `register_preview` with `replace:true` KILLS the running server during handover — always restart it after (use the Start-Process recipe, wait for port 8080 to answer 200, then re-register with the NEW pid without `replace`).
- `preview_screenshot` often fails ("produced no frames") or returns a stale frame: the embedded webview can stop compositing entirely (measured 0 rAF callbacks/sec, frozen animation timeline). Trust `preview_evaluate`/`preview_snapshot` DOM reads over screenshots; taking a screenshot can kick frames back to life.
- CSS animations never start inside `display:none` subtrees — right-rail cards (hidden below `xl`) don't animate when the page loads narrow. Not a code bug; animations run at ≥1280px.
- Detached server launch: PowerShell `Start-Process -FilePath npm.cmd -ArgumentList run,dev -RedirectStandardOutput <log> -RedirectStandardError <log.err> -PassThru` (stdout/stderr must be different files). The terminal tool times out (~15s) while the server still starts — don't retry; poll the log and port after ~8s.

## Data-layer invariants

- `useTradeData`: demo data is for **confirmed signed-out visitors only** (`!authLoading && !user`). Signed-in users get `loading`/`isEmpty`/`error` with empty data — never sample numbers. Fetched rows are keyed by `userId`; a realtime `postgres_changes` subscription on `trades` plus window-focus refetch keep surfaces live. New data surfaces must branch on the hook's `loading`/`isEmpty`/`error`, not re-derive.
- Supabase `trades` row mapping: `entry_reason` → `note`, `emotion_before`/`emotion_after` → emotions (nullable → renders "—"). All derived stats/curves/scores live in `src/lib/trade-stats.ts` and are safe on empty input.

## Routes & app state

- Dashboard is `/app` (`src/routes/_authenticated/app.tsx`), not `/`.
- Onboarding state: welcome modal gated by `cfx-onboarded` in localStorage; checklist dismiss flag lives in the `cfx-profile` store via helpers in `src/lib/profile.ts`. Tests should seed `cfx-onboarded=1` to skip the welcome modal.
