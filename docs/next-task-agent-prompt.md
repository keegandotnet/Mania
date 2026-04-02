# Agent task: play UX — per-round results, host panel, reviews

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute, after any open work is finished, and call out risks to the user if needed.

---

## Goal

### Product / UI (read [`app/play/PlayShell.tsx`](../app/play/PlayShell.tsx), [`app/results/ResultsView.tsx`](../app/results/ResultsView.tsx), [`app/actions/mania.ts`](../app/actions/mania.ts))

1. **Round results after each round** — Players should see outcomes **when a round finishes** (`revealed`), not only as an end-of-game summary. For example: after reveal, show an on-`/play` block for the **latest revealed round** (album, scores, review blurbs) and/or tighten the flow to **`/results`** so the just-finished round is obvious. Avoid a UX where results feel delayed until the whole game completes.

2. **Host panel visibility** — **Hide** the host **“Round control (host only)”** panel **while a round is in progress** (`awaiting_album` or `awaiting_reviews`). Show it when there is **no current round**, when the latest round is **`revealed`** (between rounds), or other moments when the host must start the next round or change limits/auto-advance. Keep settings accessible whenever the game is not in those “mid-round” states.

3. **Review input** — Replace the review **single-line `<input>`** with a **`<textarea>`** suitable for long text; support **newlines** end-to-end (submission and storage already use plain text — verify nothing strips `\n`).

4. **Review display / layout** — Long review text must **not overflow** horizontally or break the layout. Use wrapping and width constraints (`min-w-0` in flex layouts, `break-words` / `overflow-wrap`, **`whitespace-pre-wrap`** where newlines should display) on **Play** and **Results** (everywhere review copy appears).

### Documentation / API

- [docs/api.md](./api.md) already documents all `mania.ts` server actions (including `getMyGameState`, `getGameResults`, host settings RPCs). Extend it only if you add or change action signatures.

## Done criteria

- [ ] Round results feel timely per-round (not end-of-game-only); describe behavior briefly in PR or commit if non-obvious.
- [ ] Host round-control panel follows the visibility rules above.
- [ ] Review form uses a multiline control; newlines persist and render.
- [ ] Review text never runs off-page in typical viewports (Play + Results).
- [ ] `npm run lint` and `npm run build` pass.

## Handoff / environment notes

### Baseline (2026-04-02)

| Item | Notes |
| ---- | ----- |
| `/results` | [`app/results/page.tsx`](../app/results/page.tsx) — dynamic, auth → else `login?next=/results`. |
| Data | `getGameResults()` — revealed rounds only, reviews + `game_members` roster; see [api.md](./api.md). |
| Docs | [security.md](./security.md) — RLS-only read path for results. [testing.md](./testing.md) — manual checks for `/results`, textarea, host panel, overflow. |

### Suggested next steps (backlog)

- **Display names** — `profiles` or Auth metadata instead of Player 1…N ([auth.md](./auth.md)).
- **Export / share** — Copy-friendly or printable summary after game complete.
- **Automated tests** — Extend `scripts/rls-smoke.mjs` or E2E for multiline reviews and results timing.

### Risks

- **Host trapped** — If visibility rules are wrong, the host might not see **Round control** when they need **Start next round**; test `revealed` + pending next round carefully.
- **RLS** — Fewer rows than expected → verify session `auth.uid()` and membership.
