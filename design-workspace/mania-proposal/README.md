# Mania proposal source

This isolated workspace contains the editable HTML/CSS mockups and PDF generator. No application files are modified.

## Rebuild

1. `python design-workspace/mania-proposal/build.py`
2. `node design-workspace/mania-proposal/render.cjs`

The export is `output/pdf/Mania UI Redesign Proposal.pdf`. Local Geist is embedded. Playwright prints selectable text and vector UI controls. Page PNGs are rendered separately with PyMuPDF. The HTML is a static design artifact, not a functional prototype.

## Evidence hierarchy

Inspected app/play/PlayShell.tsx, AlbumAutocomplete.tsx, app/play/page.tsx, app/results/page.tsx, ResultsView.tsx, app/account components, authentication forms, SiteHeader.tsx, actions/mania.ts, and SQL migrations. Current implementation and migrations take precedence over older docs/ux.md claims about display names and host control visibility. Current-state illustration is explicitly reconstructed, not captured from a running authenticated app.

## Action coverage

| Existing action or rule | Proposal location |
| --- | --- |
| Public entry, login, signup | 5, 11 |
| Password recovery, resend confirmation, callback and invite handoff | 11 |
| Sign out, display name, underlying account identity | 11 |
| Group selection, create, join by code/link | 3, 6, 11 |
| Copy invitation code/link, full roster | 11 |
| Leave group, confirm/cancel, retained history | 11 |
| Create game (any member becomes host) | 6, 11 |
| Round limit save before first round, player-count minimum, max 500 | 11 |
| Start first/next round, host only | 10, 11 |
| Auto-advance toggle, locked round limit | 9, 11 |
| Close early, irreversible missing reviews, next-round/final consequence | 9 |
| Spotify search/select/change, manual entry, optional URL | 7 |
| Picker-only submission, no repeat albums, no self-review | 7, 9, 12 |
| External listening before and after submission | 7–10 |
| Decimal rating 1.0–10.0, optional text, one immutable submission | 8 |
| Manual refresh and waiting | 9 |
| Hidden reviews and role checks | 8, 9, 12 |
| Latest reveal, prior rounds, standings, full statistics, summary copy | 10 |
| Final round, completed game, another game | 6, 10, 11 |
| History including former groups | 11 |
| Late joiners, empty groups, no game, errors | 6, 11, 12 |

Quick-score buttons are intentionally consolidated into one decimal input, preserving their underlying action. No review edit, deadline, notification system, playback, or new API is proposed.

## Sample data

Sunday Records: Alex (viewer, first picker), Sam (host, second picker), Priya, Leo. Four rounds, fixed order. Round 2: Blue Hours by June Atlas. Revealed ratings 8.4, 8.7, 8.4 average to 8.5. Round 1: Small Satellites by The Night Maps, average 8.0. Manual-entry alternative: All the Roads We Took Before the Morning Came by The Paper Satellites. All names, albums, reviews and search results are fictional.

## Artwork provenance

`assets/blue-hours.png` was generated with the built-in image-generation tool, then copied here. Prompt: “Create a single square fictional indie album cover for a UI design proposal. Title exactly 'BLUE HOURS' in small refined cream typography at top left, artist 'JUNE ATLAS' at bottom left. Full bleed analog film photograph of a midnight blue ocean, pale pink moon near upper right, delicate silvery wave reflections, dreamy but sophisticated editorial music sleeve, subtle grain, blue and dusky pink palette. No border, no mockup, no vinyl, no other text.”

## Validation scope

Twelve landscape PDF pages rendered and visually inspected. Layout audit checks phone content bounds, right edges and slide body limits. Static stress fixture uses a 320 px phone, long title, and a 5,000-character review. Missing artwork and search failure are illustrated on page 7; submitted/picker/waiting states on page 9; completion on page 10; late joiner treatment on page 11. These are design checks, not production accessibility or backend tests.

Before implementation, verify aggregate review counts under RLS and test proposed focus, 200% zoom, reduced motion, real keyboard controls, and dark-mode contrast in working UI. Automatic refresh, cross-visit drafts, and local group persistence require additional client implementation. Named pending reviewers and picker identity on Play require data-contract review.
