# Agent task: Gamey mobile landing-page refresh

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-05-08)

- Core gameplay is usable and Phase 1 now includes a share-friendly Results summary foundation on `/results`.
- The current public landing page in `app/page.tsx` is too dense: it has many small widgets/cards, a desktop-heavy hero layout, and a restrained editorial feel.
- The user wants the next landing page to **pop**: more mobile-friendly, more vertical, more game-like, more colorful, and more animated than the current UI.
- The user explicitly chose this scope for app imagery: **placeholder screenshot panels**, presented in a **carousel**, and permission to **break the current landing-page UI scope** where needed.
- Cursor can take screenshots through browser automation, but this task should not depend on authenticated real screenshots. Use screenshot-like placeholders based on actual app screens now; real captured screenshots can replace them later.

---

## Goal (one vertical)

Ship a public `/` landing-page refresh that feels like a bold, mobile-first game marketing page while still preserving clear CTAs and accessible copy:

1. Replace the dense current landing-page widget grid with a simpler vertical story optimized for mobile.
2. Add a prominent gamey hero with punchier copy, strong CTAs, richer color, and lightweight engaging animation.
3. Add a screenshot carousel section using placeholder/screenshot-style panels from inside the app (`/play`, `/results`, `/account` concepts are good candidates).
4. Keep the implementation frontend-only unless a tiny helper/component extraction clearly improves maintainability.
5. Update project docs to describe the marketing-page visual exception and the placeholder screenshot strategy.

This is a **product/marketing vertical**. It is okay to substantially replace the current `app/page.tsx` structure instead of preserving existing widgets.

---

## Files likely touched

- `app/page.tsx`
- `app/components/` or `app/marketing/` if extracting a small carousel/client component
- `app/globals.css` if adding tiny reusable keyframes/utilities for landing-page motion
- `docs/design.md`
- `docs/roadmap.md`

---

## Done criteria

- [ ] `/` has a simpler mobile-first vertical flow: hero, how-it-works, screenshot carousel, CTA; avoid the current many-widget feel.
- [ ] Hero copy is shorter and punchier, with obvious signed-out and signed-in CTAs still driven by the existing `user` check.
- [ ] Visual direction is more game-like: richer color, layered cards, score/reveal language, and small motion that respects accessibility.
- [ ] Screenshot carousel uses placeholder/screenshot-style panels based on actual app surfaces; do not block on authenticated browser screenshots.
- [ ] Carousel works on mobile and desktop without horizontal page overflow. Prefer accessible buttons/scroll snapping over fragile auto-advance.
- [ ] If animation is added, include `motion-reduce` handling or otherwise keep it non-essential.
- [ ] `docs/design.md` documents a narrow marketing-page exception allowing this bolder landing treatment.
- [ ] `docs/roadmap.md` marks the landing-page refresh appropriately.
- [ ] `npm run lint` and `npm run build` pass.

## Decisions already made (for future agents)

- **Spotify integration** (Phase 3): server-side proxy only — secrets never in the browser.
- **Share summary scope:** plain-text clipboard export first; no public URLs or image/PDF export in this vertical.
- **Landing screenshot scope:** use placeholders/screenshot-style panels now; do not require real captured app screenshots for completion.
- **Carousel:** include a carousel-style presentation for app screenshots/placeholders.
- **Visual scope:** the landing page may break out of the current restrained UI rules, but document the exception and preserve accessibility.

## Risks

- Over-animating can make the page feel busy or inaccessible. Keep motion playful but limited, and respect reduced-motion users.
- Placeholder screenshot panels can become misleading if they drift from real UI. Base labels/content on real app concepts and call them placeholders in code/docs where appropriate.
- If you add a client carousel, keep the client boundary narrow so the rest of the landing page remains server-rendered.
