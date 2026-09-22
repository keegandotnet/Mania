import assert from "node:assert/strict";
import test from "node:test";
import { isSpotifyCoverUrl, sanitizeNextPath } from "./url.ts";
import { memberLabel } from "./memberLabel.ts";

test("Spotify cover allowlist rejects arbitrary tracking origins", () => {
  assert.equal(isSpotifyCoverUrl("https://i.scdn.co/image/abC123"), true);
  assert.equal(isSpotifyCoverUrl("https://tracker.example/pixel.png"), false);
  assert.equal(isSpotifyCoverUrl("https://i.scdn.co.evil.example/image/abc"), false);
  assert.equal(isSpotifyCoverUrl("http://i.scdn.co/image/abc"), false);
});

test("redirect sanitizer keeps navigation local", () => {
  assert.equal(sanitizeNextPath("/play?group=abc"), "/play?group=abc");
  assert.equal(sanitizeNextPath("//evil.example"), "/account");
  assert.equal(sanitizeNextPath("https://evil.example"), "/account");
});

test("legacy profiles get stable non-email labels", () => {
  const roster = [
    { userId: "a", playerOrder: 0, displayName: null },
    { userId: "b", playerOrder: 1, displayName: null },
  ];
  assert.equal(memberLabel("a", "a", roster), "You");
  assert.equal(memberLabel("a", "b", roster), "Player 2");
});
