# Mania – Product Overview

Mania is a private, turn-based album rating game.

Users create groups, start games, and take turns submitting albums.
Other players rate (1–10) and leave written reviews.
Results are revealed after all reviews are submitted, or the host advances the round early.
After each round is revealed, players are automatically taken to the Results page to see scores and reviews.

## MVP Scope

- Manual album entry (no streaming integration yet)
- Async gameplay — players don't need to be online simultaneously
- Private groups joined via 6-character invite code
- Max 6 users per group
- Round limit set before the game starts (min = number of players; locked once play begins)
- Auto-advance option: host can turn on automatic progression after the last review
- Optional **display names** (`profiles`) with email fallback; editable on `/account`, optional field on `/signup`

## Core Loop

1. Create or join a group
2. Create a game (host sets round limit)
3. Host starts a round → designated picker submits an album
4. Other players rate (1–10) and optionally write a review
5. Round reveals → all players see scores and reviews on Results
6. Host starts the next round (or auto-advance triggers it)
7. Repeat until the round limit is reached

## Results UX

- `/results` shows all revealed rounds, each with album, average score, and per-player ratings + reviews
- Color-coded scores: green (≥ 8), amber (5–7.9), red (< 5)
- Visual rating bar per review
- "Top pick" badge on the highest-average round
- Players are identified by display name when set, otherwise email

## Roadmap

- Phase 2: Spotify integration for album search and cover art
- Phase 3: Analytics and history
- Phase 4: Mobile app
