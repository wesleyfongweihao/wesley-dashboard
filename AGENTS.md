<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# wesley-dashboard — Agent Notes

## What this app is

A personal finance tracker for Wesley (the "Money" / FinOps module). Tech stack, confirmed from the codebase:

- **Next.js 16.2.10** (App Router, Turbopack) — pages live under `src/app/`, with the whole finance module under `src/app/finops/`
- **React 19.2.4** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** components (`src/components/ui/`) for styling
- **Supabase** (`@supabase/supabase-js`) as the backend/database — a single `transactions` table
- **lucide-react** for icons

App-specific UI lives in `src/components/finops/`; shared logic (dates, formatting, aggregation, category rules) lives in `src/lib/`.

## Working with Wesley

Wesley is not a software engineer and will not be reviewing code directly. This means:

- Explain things in plain English — no unexplained jargon.
- Make careful, considered decisions on his behalf rather than presenting technical choices for him to adjudicate.
- Use your best judgment on implementation details instead of asking him to read or approve a diff.

## Verification method: manual testing only

This project has **no automated test suite**. Wesley verifies changes himself by manually clicking through the app. Because of this:

- Work in **small, self-contained commits** — one logical change per commit, with a clear plain-English commit message.
- After **each** commit, stop, explain in plain English what changed and why, and ask him to test the app before continuing to the next change.
- Don't chain multiple unrelated changes into one commit or push through several changes without pausing for feedback in between.

## Never change behavior unless explicitly asked

Unless Wesley has explicitly asked for a behavior change:

- Never change a function's inputs, outputs, or behavior.
- Cleanup/refactor work may only touch **structure, naming, dead code removal, and de-duplication**.
- If a "cleanup" would change what the app does, shows, or returns, it's not cleanup — it's a feature change, and needs his explicit go-ahead first.

## When in doubt, don't

If you're not highly confident a change is safe, don't make it. Flag it to Wesley in plain English instead of guessing or proceeding anyway.

## Business rules that must never be silently broken

These are load-bearing assumptions in the Money module. Changing any of them is a behavior change, not cleanup — never touch them without Wesley explicitly asking:

1. **`week_ending` is derived, never manually entered.** It's computed from `txn_date` server-side (the app's insert/update payloads never include it — see `transaction-editor.tsx`), but every transaction row must still expose `week_ending` so the app can read it back for grouping.
2. **Monthly totals are grouped by the month of `week_ending`, not `txn_date`.** This is intentional (see `currentMonthKeyByWeekEnding` in `src/lib/dates.ts` and the dashboard/month queries, which filter by `week_ending` ranges).
3. **`mode` is one of `Fixed` / `Flex` / `Big Amount`:**
   - `Fixed` has locked preset amounts for specific items — Apple phone, Insurance, Rental, Hair, TNG 50 (`LOCKED_FIXED_AMOUNTS` in `src/lib/finops-shared.ts`). Picking one of these auto-fills both amount and description.
   - `Big Amount` only asks for a description and amount — it skips the category step entirely (category is auto-set to "Others"), unlike `Fixed`/`Flex`.
4. **Row Level Security (RLS) is intentionally NOT enabled** on the Supabase `transactions` table. This is a deliberate, deferred decision — not an oversight. Don't enable RLS, add policies, or otherwise touch Supabase auth/security settings without asking Wesley first.

## Running the app

Dev server (Windows, PowerShell):

```
npm run dev
```
