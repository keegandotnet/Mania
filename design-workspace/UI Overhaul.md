# UI Overhaul

**Mania implementation handoff · Design approved September 24, 2026 · Implementation pending**

This is the single authoritative handoff for the next agent. The user reviewed and approved the 12-page design proposal and requested these instructions for implementing it. Do not restart discovery, ask the previous design questions, or produce another proposal before implementing. This handoff packages the agreed direction, screen requirements, rules, scope, implementation order, and acceptance criteria. No production changes have been made as part of the design/handoff work.

## Start here

1. Read this entire file and the repository's `AGENTS.md`. Before writing Next.js code, read the relevant guides in the installed `node_modules/next/dist/docs/`; this repository uses Next.js 16.3.5 at handoff, with version-specific conventions.
2. Inspect the current branch and working tree. Work on a dedicated implementation branch. Preserve unrelated user changes. Follow [the repository handoff workflow](.cursor/rules/NEXT-AGENT-TASK.mdc), with this user's already approved scope taking precedence over a new round of feature selection.
3. Open the [approved visual proposal](output/pdf/Mania%20UI%20Redesign%20Proposal.pdf). Use it as the visual target, not as a suggestion to substitute a generic dashboard. The text below is sufficient to understand the full functional specification without prior conversation.
4. Inspect current implementation and migrations before changing behavior. Existing server authorization and game rules remain authoritative. Older UX/testing documentation contains stale statements; do not restore outdated behavior to match those statements.
5. Implement the full approved overhaul as one coherent product vertical, with the checkpoints below for organization. Complete and validate the work rather than stopping after tokens, a homepage, or isolated mockups.

### Visual/source package in Git

| Artifact | Purpose |
| --- | --- |
| `output/pdf/Mania UI Redesign Proposal.pdf` | Approved 12-page visual reference; keep this with the handoff |
| `design-workspace/mania-proposal/proposal.html` | Inspectable static mockups with selectable text and CSS |
| `design-workspace/mania-proposal/build.py` | Generates the HTML source |
| `design-workspace/mania-proposal/render.cjs` | Prints the PDF and runs static layout/stress checks |
| `design-workspace/mania-proposal/assets/` | Local Geist font and fictional sample artwork |
| `design-workspace/mania-proposal/README.md` | Source evidence, asset provenance and reproduction details |

The HTML and PDF are static design artifacts, not production components. Do not copy their absolute slide dimensions, nonsemantic mock buttons, or decorative phone frames into the app. Rebuild the design using responsive, accessible components. The generated fictional artwork is for mockups/test fixtures; real rounds must use actual persisted album metadata. Rendered page PNGs and audit JSON are QA intermediates, not app assets.

This handoff supersedes the old design-only process in `UI Overhaul.txt`, the prior next-task brief, and the old requirement to preserve thick borders on every panel. The PDF is approved as a direction, not as permission to change backend rules. Small implementation corrections needed for accessibility, responsive layout, or truthful state are expected.

## Product objective

Make Play easy to use during brief phone visits over several days. Prioritize music discovery, album artwork, the current round's next action, and friends' reviews. Preserve Mania's colorful sticker personality with calmer layouts and direct language.

The user should immediately understand: which group is selected, which round is active, what album is involved, and whether they should choose, listen/review, wait, or read results. Full rosters, invitations, setup, identity details, host settings and statistics belong in clearly labeled secondary views. No useful existing action should disappear.

## Scope and boundaries

**Included:** public and returning-player homepages; shared navigation and selected-group continuity; all Play states; Spotify/manual picking; decimal review input; persistent album/listening access after submission; reveal/results/history; group lobby/setup; account/auth visual consistency; restrained record transitions; accessibility and failure handling.

**Unchanged:** external listening, authentication providers, game membership snapshots, scoring, picker order, permissions, existing server actions, and backend capabilities. This is a frontend overhaul, not a rebuild.

**Not included:** music playback, Spotify user OAuth, new public APIs, analytics products, deadlines, notifications, public sharing URLs, review editing, realtime subscriptions, automatic polling, or cross-visit review draft persistence. Existing copy-to-clipboard results summaries and per-game statistics remain supported.

**Required client work:** remember the last valid selected group, propagate explicit group/game context through navigation and safe auth return paths, and implement accessible transitions. Reuse existing state fields/actions. Do not silently change schema/RLS or invent data to fill a mockup. If a safe required behavior cannot be supported by current contracts, identify the exact gap and propose the smallest separate change; continue independent UI work.

## Baseline to preserve

Inspect `app/actions/mania.ts`, current SQL migrations, and the actual UI. Relevant surfaces include `app/page.tsx`, `app/components/SiteHeader.tsx`, `ui.tsx`, `AlbumCoverArt.tsx`, `app/play/page.tsx`, `PlayShell.tsx`, `AlbumAutocomplete.tsx`, `app/results/page.tsx`, `ResultsView.tsx`, `app/account/*`, and the login/signup/reset-password/callback flows.

| Rule | Required behavior |
| --- | --- |
| Group capacity | Maximum six members; preserve invalid/duplicate/full-group errors |
| Game creation | Any eligible group member can create a game and becomes its host |
| Participation | Game membership and order are snapshotted at game creation; late group joiners wait for the next game |
| Turn order | Fixed game roster order cycles across rounds; moving UI does not reorder players |
| Album submission | Only the designated picker; no repeat normalized album/artist within the same game |
| Reviews | Game participants except the picker; one review each; no edits after submission |
| Rating | 1.0–10.0, one decimal place; preserve server validation and rounding |
| Written review | Optional, multiline, current 5,000-character maximum; preserve line breaks |
| Visibility | Review content and ratings stay hidden until reveal, including from the picker/host |
| Score | Average of submitted ratings only; missing reviews are excluded; no ratings is not a score of zero |
| Reveal | Last required review reveals the round; host may close an awaiting-review round early |
| Early close | Irreversible: reveals submitted reviews and starts the next round, or completes the game at the limit |
| Host controls | Start/advance, early close, round-limit update, and auto-advance remain host-only |
| Awaiting album | Cannot force-advance while waiting for the picker to submit |
| Round limit | Whole number, minimum player count, maximum 500; editable only before the first round |
| Auto-advance | Last review can start the next round; final round completes regardless of auto-advance setting |
| History | Leaving a group preserves historical game access through game membership |
| Identity | Use existing display names and safe stable player-label fallbacks; do not expose other players' emails |

Older `docs/ux.md`/`docs/testing.md` claims about hiding host controls throughout `awaiting_reviews`, planned-only display names, and universal results redirects are stale. Resolve those against current code/migrations and update them as part of implementation.

## Navigation and selection contract

- **Home `/`:** signed out sees the public invitation. Signed in sees the selected group's current state and next action immediately.
- **Play `/play?group=…`:** current round task. Keep this route and existing deep links working.
- **Results `/results?group=…`:** latest reveal by default; labeled controls expose earlier rounds, standings and additional statistics.
- **Historical results `/results?game=…`:** explicit game identity wins. Include group context where valid, but never replace the historical game with the group's current game.
- **Group:** introduce a clearly labeled secondary group view, preferably `/group?group=…`, for roster, invites, setup and host settings. This is a frontend route choice, not a new public API. Reuse existing actions and authenticated data access.
- **Account `/account`:** display name, own identity details, memberships, all game history and sign out. Group management links may remain here as shortcuts.
- **Auth:** preserve login, signup, password reset, resend confirmation, safe callback/next handling and invite handoff. Do not introduce a new sign-in method.

Compact group switcher: selected name, other memberships, then Join group/Create group. Avoid a row of competing orange group buttons. Explicit valid URL context wins over remembered selection. Remember selection locally per signed-in user, not in a way that leaks across users. Validate membership on return, clear stale selection after leaving/sign-out, and show a chooser for invalid/inaccessible context. Do not silently select a different group because it has an outstanding action. Avoid showing another group's content during hydration.

Carry context on header links, results links, completion actions, account/group return paths and auth redirects. Browser Back should restore the group and selected historical round where practical. Navigating to a late joiner's group must not grant that user access to the ongoing game's protected data.

## Visual system and copy

- Keep Geist and the existing color family. Light canvas `#FAFAF9`, white surfaces, ink `#111827`; retain the existing dark-mode tokens with independent contrast checks.
- Retain orange `#F97316`, pink `#F9A8D4`, lime `#BEF264`, yellow `#FACC15`, green `#22C55E`, peach `#FDBA74`. Strong orange means the primary action. Do not use it as decorative emphasis throughout the page.
- Put dark text on bright fills. Use readable secondary text; do not reuse low-opacity labels simply because they look quiet. Verify actual contrast.
- Use spacing and fine dividers instead of nested bordered cards. Keep a restrained hard sticker shadow, about 2 px, on a main action or occasional brand accent. Avoid tinting every section or tilting controls.
- Implement shared primitives in `app/components/ui.tsx` and shared tokens in `app/globals.css`; avoid a second competing component system.
- Responsive type target: headings approximately 28–40 px, body 16 px/1.5, labels 14 px. Use content rather than slide dimensions to determine actual sizes.
- Use a 4 px spacing base, approximately 20 px phone gutters, and comfortable 24–32 px section gaps. Limit review reading width to about 60–65 characters.
- Square album artwork, proportional and uncropped, should be a strong focal point. Allow a compact album/header arrangement where needed to keep review input reachable. Use a labeled square fallback with real album/artist text if art is missing.
- 48 px minimum interactive targets, including icon actions. Full keyboard access, visible focus, permanent labels, semantic controls, and adequate contrast in both color schemes.
- Prefer “Choose an album,” “Listen,” “Submit album,” “Submit review,” “See reviews,” “Earlier rounds,” “Standings,” “Group details,” and “Host settings.” Remove forced slang, repeated explanations, and “reveal chaos.”

## Screen-by-screen specification

### 1. Direction (PDF page 1)

Use the hero preview to understand the hierarchy: album, next action and friends. This page is rationale, not an extra app screen. Quiet surrounding surfaces are essential to the approved visual direction.

### 2. Current experience (PDF page 2)

The illustrated current Play stack is reconstructed from source, not a screenshot. Current overload comes from repeated page/status explanations, identity/invite tiles, host panels, roster/setup blocks and competing borders. Do not reproduce that stack with slightly different colors.

### 3. Navigation (PDF page 3)

Implement the navigation contract above. Move secondary actions to Group/Account/Results, keep them findable with visible labels, and preserve selected group throughout.

### 4. Visual system (PDF page 4)

Use the tokens, typography, spacing, buttons, artwork and copy principles above. Mockup buttons are illustrative; use real buttons/links, numeric fields, checkboxes/switches and forms in production.

### 5. Public homepage (PDF page 5)

Short promise: discover albums with friends, listen in your own time, then review. Prominent record with an orange **Start** label. The entire record is one accessible link/button with a destination-oriented accessible name. Start enters the existing signup/setup flow. Log in and Join a group remain distinct secondary paths. The signed-out header must not show a current group or authenticated navigation.

Desktop: concise text beside the record, then a short choose/listen/review explanation. Phone: stack text, record and secondary entry paths. Avoid multiple repeated hero CTAs. Old screenshot carousel is not mandatory in this design; replace it with the approved simpler homepage. If product screenshots are retained, use sanitized data and capture the redesigned UI, not the old interface.

### 6. Returning-player homepage (PDF page 6)

Show selected group and next action immediately, current round and album if one exists. Record label **Resume** opens the current Play state; caption explains the destination. Compact switcher stays available.

- No membership: Create group / Join group entry.
- Group with no game: **Open group** to lobby; eligible member can create a game.
- Pending game: host can enter setup/start; members see waiting for the host.
- Active participant: Resume returns to picking, reviewing, submitted or waiting state.
- Late joiner: explain next-game participation; Open group, no active-game form.
- Revealed/completed game: **See reviews**, with Group entry for a new game. Do not pretend a completed game can be resumed.

Show only data for the selected group. No new activity feed, urgency sorting or notifications. Fresh server state determines the next action.

### 7. Choose an album (PDF page 7)

Only the designated picker gets this form. Other participants see the awaiting-album state.

Support Spotify search, keyboard-navigable suggestions, selection with cover/title/artist, preview, Change album and Submit album. Keep search loading, no results, unavailable and unconfigured states distinct and actionable. Preserve debounce/cancellation behavior and guard against stale suggestions overwriting newer queries.

Manual entry must always be accessible: required album and artist, optional safe listening URL. Search failure must not strand the player. Preserve entered values, validate inline, retain existing duplicate-album rejection, and do not require artwork or Spotify configuration. Display full long names through wrapping. Metadata changes must retain the existing consistency rules for Spotify IDs/covers.

Selected preview is reviewable before submission. “Listen” opens the supplied external destination, with its external-link meaning clear. Disable duplicate submission during the pending request. Do not imply a picker may edit/retract a posted album if no such existing action exists.

### 8. Listen and review (PDF page 8)

Round label, prominent artwork/title/artist, external **Listen** link and aggregate progress precede the review form. One numeric rating input supports 1.0–10.0 with 0.1 steps and direct decimal typing. Increment/decrement controls may operate that same input; remove redundant quick-score/sentiment controls. Preserve server validation.

Optional written review, visible label, multiline support, current length limit. State that friends cannot see reviews until reveal. **Submit review** is the primary action. Show Submitting immediately, confirm only on server success, preserve values/errors on failure and prevent repeat submission.

Phone stacks content without excessive introductory chrome; desktop places album/listening and form side by side at a comfortable width. Opening an external listening tab must not clear an in-page draft. Cross-visit draft storage is deferred.

### 9. Waiting and host actions (PDF page 9)

**Submitted reviewer:** confirmation, album art/metadata, Listen, aggregate progress, hidden-review explanation, Refresh and secondary Group/Results links. No editable review form or leaked peer ratings.

**Picker after posting:** “Waiting for reviews,” album and Listen, progress, Refresh; explain that the picker cannot review their own album. No rating control.

**Awaiting album, other participant:** round identity, “Waiting for the album,” Refresh. Never show submission controls to that participant. Do not invent the picker's name from group order when it is not provided by the current game contract.

**Host settings:** labeled secondary view, reachable from Group and appropriate contextual navigation. Keep auto-advance as a real labeled control. Show editable round limit with Save before the first round, then a locked value. Start round 1 / Start next round appears only for the host in valid states.

**Early close:** host only during awaiting reviews, never awaiting album. Confirmation shows submitted/expected count and clearly says the missing reviews cannot be added afterward. Nonfinal: “Close and continue” reveals and starts the next round. Final: “Close and finish game.” Cancel leaves state unchanged. Keep the server as authority and handle races with incoming reviews.

### 10. Reveal and results (PDF page 10)

Default to the latest revealed album's average, review count, artwork, artist/picker and friends' reviews. Preserve listening after reveal. No average or review content before authorized reveal. An empty revealed round shows **No ratings**, not 0.0.

**Earlier rounds** opens the revealed archive and lets a player read the selected round's full content. **Standings** exposes existing picker ranking; **More statistics** exposes the existing reviews written, average given, pick counts/top picks, club average, word count and best-round information. Preserve scoring/tie behavior from existing calculations. **Copy results summary** remains available, with copy success/failure feedback.

When a round reveals, retain a reliable **See reviews** destination even if auto-advance already created a new awaiting-album round. Do not depend only on the newest round still having `revealed` status. Use existing authorized results data; do not add polling as an unmentioned requirement. Preserve useful existing client navigation after submit/refresh without claiming every browser updates automatically.

Manual mode: host starts the next round through Play/host controls; other players wait. Completed game: final reveal and full history plus **Open group** to create another game when eligible. No active review controls, Resume action or further host advance on a completed game.

### 11. Supporting experiences (PDF page 11)

**Group lobby:** group name, full roster/order, capacity, invite code/link with copy controls, Create game when eligible, and pending-game host setup/start. Explain the roster snapshot and late-join behavior without exposing inaccessible game data.

**Account:** edit/save display name, own email and expandable account ID, group membership shortcuts, sign out and game history. Preserve identity fallbacks and active-session handling on auth pages.

**Leave group:** confirmation/cancel, retained-history explanation, special last-member wording and existing backend rejection messages. Update membership/selection safely after success. Do not erase historical game membership or add a new host-transfer rule.

**History:** all previously accessible games, including former groups, with group, creation date, status and round progress. Open using explicit game ID. Never substitute the current game when a history entry is selected.

**Authentication:** preserve safe local redirects and intended group/game/invite destination through existing forms and email flow where supported. Invalid/full invite, failed login, expired session, reset and resend-confirmation states need legible inline feedback. Treat the auth provider's configuration as the baseline.

### 12. Motion and resilience (PDF page 12)

Record at rest identifies Start/Resume. Activation gives a restrained 120–180 ms press/small shift; pending state reads Opening. Destination focuses the appropriate heading, and album artwork takes visual priority. No ambient endless spin, audio, waveform, volume or playback controls. The approved record is game entry, not a music player.

Reduced motion removes spin/translation and uses immediate navigation/status changes. Interaction never waits for animation completion. Dialogs manage focus, permit safe dismissal, and return focus to their trigger. Announce pending/success/error state without noisy repetition.

Missing artwork: proportional labeled fallback. Missing listening URL: “No listening link,” no dead button. Search failure: retry/manual entry. Submission failure: retain values. Stale round/session: refresh authoritative state, explain the change, and prevent invalid resubmission. Do not fetch private review content merely to hide it with CSS.

## State acceptance matrix

| State / viewer | Main content and action | Must not appear |
| --- | --- | --- |
| Signed out | Public Start, Log in, Join | Selected private group data |
| Signed in, no group | Create / Join group | Invented active game |
| Group, no game | Lobby / Create game | Review form |
| Pending, host | Setup / Start round 1 | Editable round limit after start |
| Pending, member | Waiting for host / Refresh | Host mutations |
| Awaiting album, picker | Search/manual / Submit album | Review own pick |
| Awaiting album, other | Waiting / Refresh | Submit album / early close |
| Awaiting reviews, eligible | Album / Listen / Submit review | Hidden peer reviews |
| Awaiting reviews, submitted | Confirmation / Listen / Refresh | Review editing / second submission |
| Awaiting reviews, picker | Album / Listen / Waiting | Rating input |
| Awaiting reviews, host | Secondary settings / confirmed early close | Peer ratings or permission bypass |
| Revealed | Latest score/reviews / See reviews | New reviews on the closed round |
| Next round auto-started | Correct new-round task + latest reveal access | Lost previous reveal |
| Completed | Final reveal/history / Open group | Resume / advance / review form |
| Late joiner | Next-game explanation / Group | Protected active-game actions/results |
| Former group member | Authorized historical game by ID | Current group membership assumption |

## Data and authorization checks before implementation

`MyGameState` already includes groups, participation, game/round state, hasReviewed, reviewProgress and revealedDetail. Reuse these instead of inventing parallel state machines.

1. **Aggregate review progress:** `reviewProgress` exists, but its underlying count must be verified under RLS for multiple users. Test the host, picker, submitted and unsubmitted reviewer. Never count visible peer review rows by weakening hidden-review protection. If safe aggregate totals are unavailable, show truthful personal/waiting state and document the precise blocked aggregate enhancement instead of displaying fabricated totals.
2. **Names and roster:** Play's round contract does not expose arbitrary picker identity. Do not infer it from current group membership when the game roster is snapshotted. Use neutral wording until existing authorized data supports a name. Named pending reviewers are not required.
3. **Refresh:** manual Refresh is required. Automatic refresh/polling is deferred. Navigation and own successful actions should re-read server state; do not claim live updates from a static count.
4. **Auto-advance:** account for an atomic reveal plus next-round creation, including on the last review. Check the authoritative returned/current state and results data rather than relying solely on a latest-round status transition.
5. **Authorization:** hiding controls does not enforce permissions. Existing action validation/RLS must continue to reject illegal calls, including stale-tab submissions.

## Implementation checkpoints

### A. Shared shell and group continuity

Inspect current code/docs. Establish quiet primitives, font/type hierarchy and color usage. Add the group-context mechanism, Group secondary destination and consistent navigation. Preserve all existing deep links and safe auth returns. Extract focused components from large shells as helpful; avoid an unrelated architecture rewrite.

### B. Play through the full lifecycle

Implement a shared album/listening block used by reviewing, submitted and picker-waiting states. Build the full state matrix, search/manual choice, single decimal input, pending/errors and secondary host controls. Exercise full rounds with multiple accounts, including auto-advance and early close.

### C. Home, reveal and supporting views

Build public/returning home and record entry. Reorder Results around the latest reveal, then add archive/standings/statistics controls. Finish Group, Account, history and auth consistency. Preserve every action in the inventory below.

### D. Responsive and accessibility finish

Compare real screens to the PDF, inspect all states on phone and desktop, handle long/missing/error content and reduced motion, and run meaningful tests. Update product documentation to describe the shipped design; report any deferred conditional item truthfully.

## Existing action inventory

| Action | Final home |
| --- | --- |
| Start / login / signup / invite entry | Public Home and auth routes |
| Reset password / resend confirmation / callback | Existing auth flows |
| Select group / create / join by code or link | Compact switcher and Group entry |
| View roster/order / copy invite code and link | Group; optional Account shortcuts |
| Leave group / confirm / cancel | Group or Account memberships |
| Create game | Group lobby; existing member permissions |
| Set/save round limit / auto-advance | Host settings |
| Start first/next round / close early | Host-only contextual action/settings |
| Search/select/change album / manual album entry | Picker's Play state |
| Submit album / open listening URL | Play |
| Set decimal rating / optional review / submit | Reviewer's Play state |
| Refresh current state | Waiting/submitted states and appropriate contextual navigation |
| Read latest/earlier reviews / external listening | Results; persistent album block on Play |
| Standings / statistics / top picks | Labeled secondary Results views |
| Copy results summary | Results |
| Edit display name / own identity / sign out | Account / existing session surfaces |
| Open active or historical game / former-group history | Account history and scoped Results |

Consolidating quick-score buttons into one numeric control preserves the rating action. Do not preserve visual duplication just to match the old number of controls.

## Validation and definition of done

### Automated checks

- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` (or `npm run verify`, which includes them).
- Extend/run focused Playwright coverage (`npm run test:e2e`) for the new lifecycle/navigation behavior using safe test data and the repository's setup. Exercise relevant existing RLS/RPC tests when touching data access. Do not reset a hosted or shared database to create screenshots.
- Verify real-user permission denials and hidden review visibility; visual tests alone cannot validate them. If an environment-dependent check cannot run, state exactly what is missing and do not mark that check passed.
- Add meaningful regression tests for selection persistence, explicit historical game routing, auto-advance reveal access and state/role distinctions. Do not write tests that merely mirror CSS values.

### Frontend checks

- [ ] Compare the homepage, returning entry, picker, review, submitted, waiting, reveal, completion, Group and Account screens with the approved PDF.
- [ ] Test narrow 320 px, typical phone 390 px, tablet, and desktop layouts; no horizontal page overflow. Verify at 200% zoom and with the on-screen keyboard.
- [ ] Long album/artist names up to existing limits, multiline 5,000-character review, long unbroken text/URLs, missing art and absent listening URL remain usable.
- [ ] Keyboard-only navigation, decimal entry, combobox arrows/Enter/Escape, focus visibility, dialog focus and screen-reader status announcements work.
- [ ] Test light/dark themes and reduced motion. Verify text contrast, 48 px touch targets and states understandable without color.
- [ ] Open the listening link, return and finish reviewing without losing the in-page draft. Test invalid ratings, duplicate submission, network failure and retry.
- [ ] Across multiple accounts, verify picker restriction, submitted-state immutability, hidden ratings/text, truthful aggregates, final review, auto-advance on/off, host early close and final-round completion.
- [ ] Exercise no group, no game, pending host/member, late joiner, completed game, full/invalid invite, leaving the last group, stale selection and historical access after leave.
- [ ] Switch between two groups, traverse all navigation/Back paths, reload, sign out/in, and follow explicit group/game deep links. No cross-group or cross-user stale content.
- [ ] Verify every action in the inventory above is reachable and appropriately authorized.
- [ ] Capture sanitized actual implementation screenshots for review; do not represent static proposal mockups as working UI.

### Documentation and delivery

Update `docs/design.md`, `docs/ux.md`, `docs/testing.md` and `docs/roadmap.md` to reflect actual shipped behavior. Reconcile stale statements, particularly review visibility, host controls, display names and refresh/reveal navigation. Only update API/schema documentation if a separately justified contract change really occurs.

Report what shipped, checks run/results, exact blockers/deferred items, and how to validate the frontend. Do not claim the overhaul complete while a required state or existing action is missing. No deployment or merge is implied by this handoff; the user controls Git publication and review.

## Fictional visual fixture

Sunday Records has Alex, Sam, Priya and Leo in that pick order. Sam is the host; Alex is the default viewer. Four rounds. Round 2 is **Blue Hours** by **June Atlas**. Revealed reviews: Alex 8.4, Priya 8.7, Leo 8.4; average 8.5. Round 1 is **Small Satellites** by **The Night Maps**, average 8.0. Long manual-entry example: **All the Roads We Took Before the Morning Came** by **The Paper Satellites**. These are fictional design fixtures, not catalog claims or production seed requirements.

The PDF's static layout was rendered and inspected on all 12 pages. A separate 320 px static fixture wrapped a 5,000-character review without horizontal overflow. These checks validate the proposal, not the future production implementation or its accessibility/permissions.
