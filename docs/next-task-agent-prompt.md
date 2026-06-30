# Agent task: Auth-aware navigation and entry CTA polish

Per [`.cursor/rules/NEXT-AGENT-TASK.mdc`](../.cursor/rules/NEXT-AGENT-TASK.mdc): when you complete a task, post the **next-agent copy-paste prompt** and a **3–5 word title** for the work you just did **in the agent chat**, not in this file. Update this document only with the **substantive task** the next agent should execute after open work is finished.

---

## Context (2026-06-30)

- Core gameplay, sticker UI, results sharing, account/group management, and Spotify album autocomplete with persisted cover art are implemented.
- During Spotify QA, the user noticed that **Log In / Sign Up** entry points still appear on some pages even after a user is authenticated.
- This is a polish vertical: improve auth-aware navigation and entry CTAs across public/authenticated routes without changing auth providers or adding new account features.
- Preserve the existing sticker visual system and safe redirect behavior.

---

## Goal (one vertical)

Make the app navigation and auth entry points accurately reflect signed-in vs signed-out state:

1. Audit `SiteHeader`, landing page, login page, signup page, account page, play page, and results page for authenticated users seeing inappropriate Log In / Sign Up CTAs.
2. When signed in, replace public auth CTAs with useful in-app destinations such as Play, Results, Account, or Sign out (following existing product patterns).
3. When signed out, preserve clear Log In / Sign Up CTAs and safe `next` redirect behavior.
4. If a signed-in user visits `/login` or `/signup`, show a signed-in state with navigation back into the app or redirect intentionally if that matches existing route conventions.
5. Keep UI accessible, mobile-friendly, and aligned with `app/components/ui.tsx` primitives.
6. Update docs/testing/roadmap for auth-aware navigation expectations.

Do not add new auth providers, password reset, email template work, invite-only access, or role/permission changes in this task.

---

## Files likely touched

- `app/components/SiteHeader.tsx`
- `app/page.tsx`
- `app/login/page.tsx` and/or `app/login/ui/LoginForm.tsx`
- `app/signup/page.tsx` and/or `app/signup/ui/SignupForm.tsx`
- `app/account/page.tsx`
- `app/play/page.tsx`
- `app/results/page.tsx`
- `lib/mania/url.ts` if safe redirect handling needs extension
- `docs/roadmap.md`
- `docs/testing.md`
- `docs/auth.md` if auth behavior is clarified

---

## Done criteria

- [ ] Authenticated users do not see primary "Log in" / "Sign up" CTAs in the global nav or page hero areas where those actions no longer apply.
- [ ] Signed-out users still see clear Log In / Sign Up paths from public pages.
- [ ] `/login` and `/signup` handle already-signed-in users gracefully (no confusing forms that create duplicate-auth intent).
- [ ] Sign out remains available from an authenticated surface.
- [ ] Safe `next` redirect behavior remains intact and documented if changed.
- [ ] No Supabase secret/service-role usage is introduced.
- [ ] `docs/roadmap.md` and `docs/testing.md` include auth-aware navigation checks.
- [ ] `npm run lint` and `npm run build` pass.

## Decisions already made (for future agents)

- **Auth provider scope:** keep existing Supabase email/password auth; no OAuth providers in this polish task.
- **Redirect safety:** continue to sanitize `next` paths to internal root-relative URLs.
- **Visual consistency:** use the existing sticker UI primitives and avoid introducing a second navigation style.
- **Authenticated destinations:** prefer Play / Results / Account as signed-in CTAs; choose based on page context.

## Risks

- Server components must read auth state without causing avoidable dynamic behavior on pages that should stay public unless the current app already marks them dynamic.
- Avoid redirect loops between `/login`, `/signup`, `/account`, and protected pages.
- Signed-in landing page copy should still make sense for returning users and not hide core onboarding context from signed-out visitors.
