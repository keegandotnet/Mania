# Agent task: Group management on /account (retention v2)

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-04-14)

`/account` now shows a "Your games" history list (last 20 games, ordered newest first, with group name, status badge, and round progress). The `getMyGameHistory` server action is live and documented in `docs/api.md`. `scripts/rls-smoke.mjs` now asserts `get_game_member_emails` and `get_group_member_profiles` shape and ordering.

The **next retention gap**: users cannot see which groups they belong to, switch between groups, or leave a group from within the UI. `leaveGroup` already exists in `app/actions/mania.ts`; `getMyGameState` returns only the _most recently joined_ group. There is no `getMyGroups` action yet.

---

## Goal (one vertical)

Ship **group management on `/account`**: a "Your groups" section that lists every group the signed-in user belongs to (name, invite code, joined date), with a **Leave** button for each group they can leave (i.e. all groups). Wire it with a **new `getMyGroups` server action** that returns all `group_members` rows for the caller, joined with `groups` (name, invite code).

### Implementation notes (non-prescriptive)

- `getMyGroups()` — plain `SELECT` on `group_members` joined to `groups` (RLS already scopes to caller's rows); no new RPC needed.
- The Leave button should call the existing `leaveGroup(groupId)` server action. After leaving, revalidate or redirect so the list updates.
- Clarify in UI copy that leaving a group does **not** remove game history (game membership is snapshotted in `game_members`).
- Invite code display: show inline (copyable text or a small copy-to-clipboard button) so players can share without navigating to `/play`.
- **No new tables or migrations** required.
- Update **`docs/api.md`** for `getMyGroups`; update **`docs/testing.md`** manual checklist with the new group management scenarios.
- **`npm run lint` && `npm run build`** must pass.

## Done criteria

- [ ] `/account` shows a **"Your groups"** section listing all groups the user belongs to with name, invite code, joined date, and a Leave button.
- [ ] Leaving a group removes the row and updates the list without a full page reload (or redirects cleanly).
- [ ] `getMyGroups` documented in **`docs/api.md`**.
- [ ] Manual checklist entry added to **`docs/testing.md`**.
- [ ] Lint and build green.

## Decisions already made (for future agents)

- **Spotify integration** (Phase 3 on roadmap): must use a **server-side proxy** — client ID/secret stay server-only, never in the browser bundle or client requests.
- **UI overhaul** (Phase 2 on roadmap): ships before Spotify; focus on typography, spacing, color system, and mobile-responsive polish across Play, Results, and Account.

## Risks

- **Leave last group:** leaving the only group is allowed (no product constraint against it yet), but the UI should make the consequence clear.
- **Active game:** if a user leaves a group that has an active game, they remain in `game_members` (snapshot). Copy should reflect this nuance if feasible.
- **RLS on `groups`:** users who are no longer a group member lose SELECT access via RLS. Confirm the query is evaluated before the leave action, not after.
