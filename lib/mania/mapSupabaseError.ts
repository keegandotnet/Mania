import type { PostgrestError } from "@supabase/supabase-js";
import { actionErr, type ActionResult } from "./actionResult";

const RPC_MESSAGES: Record<string, string> = {
  unauthorized: "Sign in required.",
  invalid_invite: "Invalid invite code.",
  already_member: "You are already in this group.",
  group_full: "This group is full (6 members max).",
  not_group_member: "You are not a member of this group.",
  active_game_exists: "This group already has an active game.",
  not_host: "Only the host can do this.",
  game_not_found: "Game not found.",
  game_completed: "This game has already ended.",
  game_not_playable: "This game is no longer accepting album submissions.",
  max_rounds_reached: "The maximum number of rounds for this game has been reached.",
  invalid_max_rounds: "Round limit must be between 1 and 500.",
  max_rounds_below_progress:
    "Round limit cannot be lower than the current round. Finish or play forward first.",
  game_already_started: "Round limit cannot be changed after the first round has started.",
  max_rounds_below_player_count:
    "Round limit must be at least equal to the number of players in the game.",
  host_of_active_game:
    "You are the host of an active game. Ask another player to take over, or end the game before leaving.",
  not_game_member: "You are not part of this game.",
  album_not_submitted: "The current round is still waiting for an album.",
  empty_roster: "This game has no players.",
  submitter_not_found: "Could not assign the next player.",
  no_round_awaiting_album: "No round is waiting for an album.",
  not_your_turn: "Only the assigned player can submit the album.",
  invalid_album_url: "Album link must be a valid absolute http:// or https:// URL.",
  round_not_found: "Round not found.",
  round_not_reviewable: "This round is not accepting reviews.",
  cannot_self_review: "You cannot review your own album.",
  invalid_rating: "Rating must be between 1.0 and 10.0.",
  reviews_immutable: "Reviews cannot be edited.",
};

function containsToken(text: string, token: string): boolean {
  return text.includes(token);
}

export function fromPostgrestError(error: PostgrestError): ActionResult<never> {
  const haystack = `${error.message}\n${error.details ?? ""}\n${error.hint ?? ""}`;

  for (const [code, message] of Object.entries(RPC_MESSAGES)) {
    if (containsToken(haystack, code)) {
      return actionErr(code, message);
    }
  }

  if (error.code === "23505") {
    const detail = error.details ?? "";
    if (containsToken(detail, "rounds_unique_album_per_game")) {
      return actionErr("duplicate_album", "This album was already submitted in this game.");
    }
    if (containsToken(detail, "reviews_round_id_user_id_key") || containsToken(detail, "(round_id, user_id)")) {
      return actionErr("review_exists", "You have already submitted a review for this round.");
    }
    return actionErr("duplicate_key", "A unique constraint was violated.");
  }

  console.error("Unhandled Supabase/PostgREST error", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  return actionErr("db_error", "Something went wrong. Please try again.");
}
