# UX Rules

## Core

- Hide reviews until round is `revealed`
- Show submission state (submitted / pending) in status banner
- Only the designated picker can submit an album for the current round
- Other players submit reviews after the album is posted

## Navigation

- After a round is `revealed`, automatically navigate all players from `/play` to `/results`
- If a player navigates to `/play` and the latest round is already `revealed`, redirect to `/results`
- Results page has a "Back to Play" link for host to start the next round

## Host panel

- "Round control (host only)" is **hidden** while a round is in progress (`awaiting_album` or `awaiting_reviews`)
- It is **visible** when there is no active round, or when the latest round is `revealed`

## Round limit

- Minimum rounds = number of players (so every player gets at least one pick)
- Round limit is **locked** once the first round starts; UI shows a read-only value after that
- Before the first round, host can set the limit in the host panel

## Display names

- Players are identified by their email address (e.g. `alice@example.com`)
- A dedicated profiles / display-name feature is planned for a future phase

## Review input

- Review text uses a multi-line textarea; newlines are preserved end-to-end
- Long review text wraps and does not overflow horizontally on Play or Results

## Results display

- Color-coded scores: green ≥ 8, amber 5–7.9, red < 5
- Visual rating bar per review
- Average score displayed prominently per round
- "Top pick" badge on the highest-average round (when ≥ 2 rounds revealed)
