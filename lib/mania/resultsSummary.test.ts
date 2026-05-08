import assert from "node:assert/strict";
import test from "node:test";
import type { GameResultsData } from "@/app/actions/mania";
import { buildResultsShareSummary } from "./resultsSummary.ts";

const baseData: GameResultsData = {
  viewerId: "user-1",
  email: "viewer@example.com",
  viewerDisplayName: "Alice",
  group: { name: "Friday Club", inviteCode: "ABC123" },
  game: { id: "game-1", status: "completed", currentRound: 2, maxRounds: 2 },
  roster: [
    { userId: "user-1", playerOrder: 0, email: "alice@example.com", displayName: "Alice" },
    { userId: "user-2", playerOrder: 1, email: "bob@example.com", displayName: "Bob" },
  ],
  rounds: [
    {
      id: "round-2",
      roundNumber: 2,
      albumName: "Second Album",
      artistName: null,
      albumUrl: null,
      pickerId: "user-2",
      reviews: [{ userId: "user-1", rating: 7, reviewText: "" }],
    },
    {
      id: "round-1",
      roundNumber: 1,
      albumName: "First Album",
      artistName: "The Firsts",
      albumUrl: "https://example.com/first",
      pickerId: "user-1",
      reviews: [
        { userId: "user-2", rating: 8, reviewText: "Sharp hooks.\nStrong finish." },
        { userId: "user-1", rating: 9, reviewText: "Immediate replay." },
      ],
    },
  ],
};

test("buildResultsShareSummary formats a stable, pasteable game summary", () => {
  assert.equal(
    buildResultsShareSummary(baseData),
    `Friday Club results
Game complete - Round 2 of 2 - 2 revealed rounds

Round 1: First Album by The Firsts
Picked by Alice
Average: 8.5 from 2 reviews
Listen: https://example.com/first
Scores: Alice 9.0, Bob 8.0
Reviews:
- Alice (9.0): Immediate replay.
- Bob (8.0): Sharp hooks.
  Strong finish.

Round 2: Second Album
Picked by Bob
Average: 7.0 from 1 review
Scores: Alice 7.0`
  );
});

test("buildResultsShareSummary handles games without revealed rounds", () => {
  assert.equal(
    buildResultsShareSummary({ ...baseData, rounds: [] }),
    `Friday Club results
Game complete - Round 2 of 2 - 0 revealed rounds

No revealed rounds yet.`
  );
});
