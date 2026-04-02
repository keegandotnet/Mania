# Agent task: profiles, end-game UX, group roster

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute, after any open work is finished, and call out risks to the user if needed.

---

## Context (2026-04-02)

Recent work already shipped: per-round results on Play, host panel visibility, multiline reviews, overflow fixes (inline fallbacks on Results for Safari cache resilience), `leaveGroup`, `/play` no longer redirects to `/results` when latest round is `revealed` (nav + Round control must stay reachable), email-based roster labels via `get_game_member_emails`, min rounds = player count, round limit locked after first round.

---

## Goal

### 1. Display names (`profiles`)

- Add a **`profiles`** table (`user_id` PK → `auth.users`, `display_name` text, timestamps). Populate on sign-up (and allow edit from `/account`).
- Replace **email** as the primary visible label in Play / Results with **display_name**, falling back to email if unset.
- Extend **`get_game_member_emails`** or add a companion RPC (e.g. return display_name) so roster rows stay one round-trip; keep RLS tight (members see only their game’s roster).
- Update [docs/api.md](./api.md), [docs/schema.md](./schema.md), [docs/auth.md](./auth.md), [docs/testing.md](./testing.md).

### 2. End-of-game UX

- When `games.status === "completed"`, Play and Results should show a **clear “game over”** state: final round summary link, optional CTA to create a new game / leave group per existing flows.
- Audit RPC `start_next_round` / client refresh paths so completed games don’t trap users in confusing banners.
- Document behaviour in [docs/state-machine.md](./state-machine.md) and [docs/product.md](./product.md) if behaviour changes.

### 3. Group roster on `/play`

- Show **current group members** (display name → email fallback) and join order on the Play page when the user is in a group, so it’s obvious who is in the room before/during a game.
- Read from `group_members` + profiles (or existing email RPC pattern); respect RLS; avoid leaking non-members.

### 4. Developer hygiene (optional, small)

- Add a short note to [docs/testing.md](./testing.md) or [docs/supabase-cli.md](./supabase-cli.md): **Safari regular profile** may cache dev CSS; use Empty Caches, Private window, or disable caches while developing — explains “Private looks better than regular.”

## Done criteria

- [ ] Display names work end-to-end (signup → account edit → Play/Results labels).
- [ ] Completed games have understandable Play + Results empty/summary states.
- [ ] Group member list visible on Play when in a group.
- [ ] Docs and `docs/api.md` match any new actions or RPCs.
- [ ] `npm run lint` && `npm run build` pass.

## Risks

- **`profiles` RLS** — Wrong policies can hide names or expose rows cross-user; mirror `game_members` / `group_members` patterns from [docs/security.md](./security.md).
- **Migration ordering** — New table + RPC grants must apply cleanly on `supabase db push`.
- **Email RPC rename** — If extending `get_game_member_emails`, update all callers in `app/actions/mania.ts` and keep backwards compatibility or migrate in one commit.

### Backlog (later)

- Export / printable summary after game complete.
- E2E or extend `scripts/rls-smoke.mjs` for profiles and completed-game flows.
