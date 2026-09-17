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
- Pre-existing benign console noise: a `<html>` hydration warning from `__root.tsx` and one external-font 404. Don't chase these when checking logs.
- `code_search` intermittently fails with a ripgrep ENOENT (uv_spawn) error; retrying the identical call usually works.

## Running & testing

- No `test` script in package.json — run `npx vitest run` (jsdom + testing-library, setup in `src/test/setup.ts`). Typecheck: `npx tsc --noEmit`. Lint: `npx eslint <files> --fix`.
- To test a TanStack file-route component, mock `@tanstack/react-router` (`createFileRoute` → identity fn, `Link` → `<a>`), dynamically import the route module, and use `(Route as any).component`. See `src/routes/_authenticated/app.dashboard.test.tsx`.
- Dashboard P&L renders on both the stat card and the trade card, so tests need `getAllByText` for money/percent strings.

## Freebuff preview webview (this environment)

- `preview_screenshot` often fails ("produced no frames") or returns a stale frame: the embedded webview can stop compositing entirely (measured 0 rAF callbacks/sec, frozen animation timeline). Trust `preview_evaluate`/`preview_snapshot` DOM reads over screenshots; taking a screenshot can kick frames back to life.
- CSS animations never start inside `display:none` subtrees — right-rail cards (hidden below `xl`) don't animate when the page loads narrow. Not a code bug; animations run at ≥1280px.
- Detached server launch: PowerShell `Start-Process -FilePath npm.cmd -ArgumentList run,dev -RedirectStandardOutput <log> -RedirectStandardError <log.err> -PassThru` (stdout/stderr must be different files). The terminal tool times out (~15s) while the server still starts — don't retry; poll the log and port after ~8s.

## Data-layer invariants

- `useTradeData`: demo data is for **confirmed signed-out visitors only** (`!authLoading && !user`). Signed-in users get `loading`/`isEmpty`/`error` with empty data — never sample numbers. Fetched rows are keyed by `userId`; a realtime `postgres_changes` subscription on `trades` plus window-focus refetch keep surfaces live. New data surfaces must branch on the hook's `loading`/`isEmpty`/`error`, not re-derive.
- Supabase `trades` row mapping: `entry_reason` → `note`, `emotion_before`/`emotion_after` → emotions (nullable → renders "—"). All derived stats/curves/scores live in `src/lib/trade-stats.ts` and are safe on empty input.

## Routes & app state

- Dashboard is `/app` (`src/routes/_authenticated/app.tsx`), not `/`.
- Onboarding state: welcome modal gated by `cfx-onboarded` in localStorage; checklist dismiss flag lives in the `cfx-profile` store via helpers in `src/lib/profile.ts`. Tests should seed `cfx-onboarded=1` to skip the welcome modal.
