"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { actionErr, ok, type ActionResult } from "@/lib/mania/actionResult";
import { generateInviteCode } from "@/lib/mania/invite";
import { fromPostgrestError } from "@/lib/mania/mapSupabaseError";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type GameResultsRosterRow = {
  userId: string;
  playerOrder: number;
  email: string;
};

/** Populated only when the latest round is `revealed` — scores and review copy for on-/play results. */
export type MyGameRevealedDetail = {
  roundNumber: number;
  pickerId: string;
  roster: GameResultsRosterRow[];
  reviews: { userId: string; rating: number; reviewText: string }[];
};

export type MyGameState = {
  viewerId: string;
  email: string;
  group: { id: string; name: string; inviteCode: string } | null;
  game: {
    id: string;
    status: string;
    currentRound: number;
    isHost: boolean;
    maxRounds: number;
    autoAdvance: boolean;
    playerCount: number;
  } | null;
  round: {
    id: string;
    roundNumber: number;
    status: "awaiting_album" | "awaiting_reviews" | "revealed";
    albumName: string | null;
    artistName: string | null;
    albumUrl: string | null;
    isPicker: boolean;
  } | null;
  hasReviewed: boolean;
  revealedDetail: MyGameRevealedDetail | null;
};

export type GameResultsRound = {
  id: string;
  roundNumber: number;
  albumName: string | null;
  artistName: string | null;
  albumUrl: string | null;
  pickerId: string;
  reviews: { userId: string; rating: number; reviewText: string }[];
};

export type GameResultsData = {
  viewerId: string;
  email: string;
  group: { name: string; inviteCode: string } | null;
  game: {
    id: string;
    status: string;
    currentRound: number;
    maxRounds: number;
  } | null;
  roster: GameResultsRosterRow[];
  rounds: GameResultsRound[];
};

export async function getMyGameState(): Promise<ActionResult<MyGameState>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const empty: MyGameState = {
    viewerId: user.id,
    email: user.email ?? user.id,
    group: null,
    game: null,
    round: null,
    hasReviewed: false,
    revealedDetail: null,
  };

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) return ok(empty);

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .eq("id", membership.group_id)
    .maybeSingle();
  if (gErr) return fromPostgrestError(gErr as PostgrestError);
  if (!group) return ok(empty);

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, status, current_round, host_id, max_rounds, auto_advance")
    .eq("group_id", group.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (gameErr) return fromPostgrestError(gameErr as PostgrestError);

  if (!game) {
    return ok({
      ...empty,
      group: { id: group.id, name: group.name, inviteCode: group.invite_code },
    });
  }

  // Fetch roster + emails for every request (used for playerCount and display names).
  type EmailRow = { user_id: string; email: string };
  const { data: emailRows, error: emailErr } = await supabase.rpc(
    "get_game_member_emails",
    { p_game_id: game.id }
  );
  if (emailErr) return fromPostgrestError(emailErr as PostgrestError);

  const emailMap = new Map<string, string>();
  for (const row of (emailRows ?? []) as EmailRow[]) {
    emailMap.set(row.user_id, row.email ?? row.user_id);
  }
  const playerCount = emailMap.size;

  const { data: rosterBase, error: rosterBaseErr } = await supabase
    .from("game_members")
    .select("user_id, player_order")
    .eq("game_id", game.id);
  if (rosterBaseErr) return fromPostgrestError(rosterBaseErr as PostgrestError);

  const rosterWithEmails: GameResultsRosterRow[] = (rosterBase ?? [])
    .map((row) => ({
      userId: row.user_id as string,
      playerOrder: row.player_order as number,
      email: emailMap.get(row.user_id as string) ?? row.user_id as string,
    }))
    .sort((a, b) => a.playerOrder - b.playerOrder);

  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .select("id, round_number, status, album_name, artist_name, album_url, created_by")
    .eq("game_id", game.id)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (roundErr) return fromPostgrestError(roundErr as PostgrestError);

  let hasReviewed = false;
  if (round?.status === "awaiting_reviews") {
    const { data: review } = await supabase
      .from("reviews")
      .select("id")
      .eq("round_id", round.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasReviewed = !!review;
  }

  let revealedDetail: MyGameRevealedDetail | null = null;
  if (round?.status === "revealed") {
    type ReviewRow = {
      user_id: string;
      rating: string | number;
      review_text: string;
    };

    const { data: revs, error: revErr } = await supabase
      .from("reviews")
      .select("user_id, rating, review_text")
      .eq("round_id", round.id)
      .order("created_at", { ascending: true });
    if (revErr) return fromPostgrestError(revErr as PostgrestError);

    const reviews = ((revs ?? []) as ReviewRow[]).map((rv) => ({
      userId: rv.user_id,
      rating: typeof rv.rating === "string" ? Number(rv.rating) : rv.rating,
      reviewText: rv.review_text ?? "",
    }));

    revealedDetail = {
      roundNumber: round.round_number as number,
      pickerId: round.created_by as string,
      roster: rosterWithEmails,
      reviews,
    };
  }

  return ok({
    viewerId: user.id,
    email: user.email ?? user.id,
    group: { id: group.id, name: group.name, inviteCode: group.invite_code },
    game: {
      id: game.id,
      status: game.status,
      currentRound: game.current_round,
      isHost: game.host_id === user.id,
      maxRounds: game.max_rounds,
      autoAdvance: game.auto_advance,
      playerCount,
    },
    round: round
      ? {
          id: round.id,
          roundNumber: round.round_number as number,
          status: round.status as "awaiting_album" | "awaiting_reviews" | "revealed",
          albumName: round.album_name,
          artistName: round.artist_name,
          albumUrl: round.album_url,
          isPicker: round.created_by === user.id,
        }
      : null,
    hasReviewed,
    revealedDetail,
  });
}

export async function getGameResults(): Promise<ActionResult<GameResultsData>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const empty: GameResultsData = {
    viewerId: user.id,
    email: user.email ?? user.id,
    group: null,
    game: null,
    roster: [],
    rounds: [],
  };

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) return ok(empty);

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .eq("id", membership.group_id)
    .maybeSingle();
  if (gErr) return fromPostgrestError(gErr as PostgrestError);
  if (!group) return ok(empty);

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, status, current_round, max_rounds")
    .eq("group_id", group.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (gameErr) return fromPostgrestError(gameErr as PostgrestError);

  if (!game) {
    return ok({
      ...empty,
      group: { name: group.name, inviteCode: group.invite_code },
    });
  }

  // Fetch emails via security-definer RPC so we can display names.
  type EmailRow = { user_id: string; email: string };
  const { data: emailRowsResults, error: emailErrResults } = await supabase.rpc(
    "get_game_member_emails",
    { p_game_id: game.id }
  );
  if (emailErrResults) return fromPostgrestError(emailErrResults as PostgrestError);

  const emailMapResults = new Map<string, string>();
  for (const row of (emailRowsResults ?? []) as EmailRow[]) {
    emailMapResults.set(row.user_id, row.email ?? row.user_id);
  }

  const { data: rosterRows, error: rosterErr } = await supabase
    .from("game_members")
    .select("user_id, player_order")
    .eq("game_id", game.id);
  if (rosterErr) return fromPostgrestError(rosterErr as PostgrestError);

  const roster: GameResultsRosterRow[] = (rosterRows ?? [])
    .map((row) => ({
      userId: row.user_id as string,
      playerOrder: row.player_order as number,
      email: emailMapResults.get(row.user_id as string) ?? row.user_id as string,
    }))
    .sort((a, b) => a.playerOrder - b.playerOrder);

  const { data: roundRows, error: roundsErr } = await supabase
    .from("rounds")
    .select("id, round_number, album_name, artist_name, album_url, created_by")
    .eq("game_id", game.id)
    .eq("status", "revealed")
    .order("round_number", { ascending: true });
  if (roundsErr) return fromPostgrestError(roundsErr as PostgrestError);

  const roundsList = roundRows ?? [];
  const roundIds = roundsList.map((r) => r.id as string);

  type ReviewRow = {
    round_id: string;
    user_id: string;
    rating: string | number;
    review_text: string;
  };

  let reviewRows: ReviewRow[] = [];
  if (roundIds.length > 0) {
    const { data: revs, error: revErr } = await supabase
      .from("reviews")
      .select("round_id, user_id, rating, review_text")
      .in("round_id", roundIds)
      .order("created_at", { ascending: true });
    if (revErr) return fromPostgrestError(revErr as PostgrestError);
    reviewRows = (revs ?? []) as ReviewRow[];
  }

  const reviewsByRound = new Map<string, { userId: string; rating: number; reviewText: string }[]>();
  for (const rv of reviewRows) {
    const rid = rv.round_id;
    const rating = typeof rv.rating === "string" ? Number(rv.rating) : rv.rating;
    const entry = { userId: rv.user_id, rating, reviewText: rv.review_text ?? "" };
    const list = reviewsByRound.get(rid) ?? [];
    list.push(entry);
    reviewsByRound.set(rid, list);
  }

  const rounds: GameResultsRound[] = roundsList.map((row) => ({
    id: row.id as string,
    roundNumber: row.round_number as number,
    albumName: row.album_name as string | null,
    artistName: row.artist_name as string | null,
    albumUrl: row.album_url as string | null,
    pickerId: row.created_by as string,
    reviews: reviewsByRound.get(row.id as string) ?? [],
  }));

  return ok({
    viewerId: user.id,
    email: user.email ?? user.id,
    group: { name: group.name, inviteCode: group.invite_code },
    game: {
      id: game.id,
      status: game.status,
      currentRound: game.current_round,
      maxRounds: game.max_rounds,
    },
    roster,
    rounds,
  });
}

export async function createGroup(name: string): Promise<ActionResult<{ groupId: string; inviteCode: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const trimmed = name.trim();
  if (!trimmed) return actionErr("invalid_input", "Group name is required.");

  for (let attempt = 0; attempt < 10; attempt++) {
    const invite = generateInviteCode();
    const { data, error } = await supabase.rpc("create_group_with_owner", {
      p_name: trimmed,
      p_invite: invite,
    });

    if (!error && data) {
      const groupId = data as string;
      const { data: row, error: selErr } = await supabase
        .from("groups")
        .select("invite_code")
        .eq("id", groupId)
        .maybeSingle();
      if (selErr) return fromPostgrestError(selErr as PostgrestError);
      const inviteCode = row?.invite_code as string | undefined;
      if (!inviteCode) return actionErr("rls", "Could not read group invite.");
      return ok({ groupId, inviteCode });
    }
    if (error?.code === "23505") continue;
    if (error) return fromPostgrestError(error);
  }

  return actionErr("invite_collision", "Could not allocate a unique invite code. Try again.");
}

export async function joinGroup(inviteCode: string): Promise<ActionResult<{ groupId: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { data, error } = await supabase.rpc("join_group_by_invite", {
    p_invite: inviteCode,
  });

  if (error) return fromPostgrestError(error);
  return ok({ groupId: data as string });
}

export async function createGame(groupId: string): Promise<ActionResult<{ gameId: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { data, error } = await supabase.rpc("create_game_for_group", {
    p_group_id: groupId,
  });

  if (error) return fromPostgrestError(error);
  return ok({ gameId: data as string });
}

export async function updateGameMaxRounds(
  gameId: string,
  maxRounds: number
): Promise<ActionResult<{ maxRounds: number }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  if (!Number.isInteger(maxRounds)) {
    return actionErr("invalid_input", "Round limit must be a whole number.");
  }

  const { error } = await supabase.rpc("update_game_max_rounds", {
    p_game_id: gameId,
    p_max_rounds: maxRounds,
  });

  if (error) return fromPostgrestError(error);
  return ok({ maxRounds });
}

export async function updateGameAutoAdvance(
  gameId: string,
  autoAdvance: boolean
): Promise<ActionResult<{ autoAdvance: boolean }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { error } = await supabase.rpc("update_game_auto_advance", {
    p_game_id: gameId,
    p_auto_advance: autoAdvance,
  });

  if (error) return fromPostgrestError(error);
  return ok({ autoAdvance });
}

export async function startNextRound(gameId: string): Promise<ActionResult<{ roundId: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { data, error } = await supabase.rpc("start_next_round", {
    p_game_id: gameId,
  });

  if (error) return fromPostgrestError(error);
  return ok({ roundId: data as string });
}

export async function submitAlbum(
  gameId: string,
  albumName: string,
  artistName: string,
  albumUrl: string
): Promise<ActionResult<{ roundId: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  if (!albumName.trim() || !artistName.trim()) {
    return actionErr("invalid_input", "Album name and artist are required.");
  }

  const { data, error } = await supabase.rpc("submit_album", {
    p_game_id: gameId,
    p_album_name: albumName,
    p_artist_name: artistName,
    p_album_url: albumUrl,
  });

  if (error) return fromPostgrestError(error);
  return ok({ roundId: data as string });
}

export async function submitReview(
  roundId: string,
  rating: number,
  reviewText: string
): Promise<ActionResult<{ revealed: boolean }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  if (!Number.isFinite(rating)) {
    return actionErr("invalid_rating", "Rating must be a number.");
  }

  const { error } = await supabase.rpc("submit_review", {
    p_round_id: roundId,
    p_rating: rating,
    p_review_text: reviewText ?? "",
  });

  if (error) return fromPostgrestError(error);

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("status")
    .eq("id", roundId)
    .maybeSingle();

  if (roundError) return fromPostgrestError(roundError as PostgrestError);

  const status = round?.status as string | undefined;
  return ok({ revealed: status === "revealed" });
}
