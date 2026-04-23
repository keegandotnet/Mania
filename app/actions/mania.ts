"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { actionErr, ok, type ActionResult } from "@/lib/mania/actionResult";
import { generateInviteCode } from "@/lib/mania/invite";
import { fromPostgrestError } from "@/lib/mania/mapSupabaseError";
import { normalizeOptionalHttpUrl } from "@/lib/mania/url";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type GameResultsRosterRow = {
  userId: string;
  playerOrder: number;
  email: string;
  /** When null or empty in UI, fall back to `email`. */
  displayName: string | null;
};

export type GroupRosterRow = {
  userId: string;
  joinedAt: string;
  playerOrder: number;
  email: string;
  displayName: string | null;
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
  viewerDisplayName: string | null;
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
  /** Current group’s members (join order); null if not in a group. */
  groupRoster: GroupRosterRow[] | null;
};

export type GameHistoryItem = {
  gameId: string;
  groupId: string;
  groupName: string;
  status: string;
  currentRound: number;
  maxRounds: number;
  createdAt: string;
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
  viewerDisplayName: string | null;
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

  const { data: viewerProf } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const viewerDisplayName = (viewerProf?.display_name as string | null) ?? null;

  const empty: MyGameState = {
    viewerId: user.id,
    email: user.email ?? user.id,
    viewerDisplayName,
    group: null,
    game: null,
    round: null,
    hasReviewed: false,
    revealedDetail: null,
    groupRoster: null,
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

  type GroupMemberRpcRow = {
    user_id: string;
    email: string;
    display_name: string | null;
    joined_at: string;
    player_order: number;
  };
  const { data: groupRpcRows, error: groupRpcErr } = await supabase.rpc(
    "get_group_member_profiles",
    { p_group_id: group.id }
  );
  if (groupRpcErr) return fromPostgrestError(groupRpcErr as PostgrestError);
  const groupRoster: GroupRosterRow[] = ((groupRpcRows ?? []) as GroupMemberRpcRow[]).map((row) => ({
    userId: row.user_id,
    joinedAt: row.joined_at,
    playerOrder: row.player_order,
    email: row.email ?? row.user_id,
    displayName: row.display_name,
  }));

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
      groupRoster,
    });
  }

  // Fetch roster + emails + display names for every request (used for playerCount and labels).
  type GameMemberRpcRow = { user_id: string; email: string; display_name: string | null };
  const { data: emailRows, error: emailErr } = await supabase.rpc("get_game_member_emails", {
    p_game_id: game.id,
  });
  if (emailErr) return fromPostgrestError(emailErr as PostgrestError);

  const memberByUser = new Map<string, { email: string; displayName: string | null }>();
  for (const row of (emailRows ?? []) as GameMemberRpcRow[]) {
    memberByUser.set(row.user_id, {
      email: row.email ?? row.user_id,
      displayName: row.display_name,
    });
  }
  const playerCount = memberByUser.size;

  const { data: rosterBase, error: rosterBaseErr } = await supabase
    .from("game_members")
    .select("user_id, player_order")
    .eq("game_id", game.id);
  if (rosterBaseErr) return fromPostgrestError(rosterBaseErr as PostgrestError);

  const rosterWithEmails: GameResultsRosterRow[] = (rosterBase ?? [])
    .map((row) => {
      const uid = row.user_id as string;
      const m = memberByUser.get(uid);
      return {
        userId: uid,
        playerOrder: row.player_order as number,
        email: m?.email ?? uid,
        displayName: m?.displayName ?? null,
      };
    })
    .sort((a, b) => a.playerOrder - b.playerOrder);

  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .select("id, round_number, status, album_name, artist_name, album_url, created_by")
    .eq("game_id", game.id)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (roundErr) return fromPostgrestError(roundErr as PostgrestError);

  const normalizedCurrentRoundUrl = normalizeOptionalHttpUrl(round?.album_url ?? null);

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
    viewerDisplayName,
    group: { id: group.id, name: group.name, inviteCode: group.invite_code },
    groupRoster,
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
          albumUrl: normalizedCurrentRoundUrl.ok ? normalizedCurrentRoundUrl.value : null,
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

  const { data: viewerProfResults } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const viewerDisplayName = (viewerProfResults?.display_name as string | null) ?? null;

  const empty: GameResultsData = {
    viewerId: user.id,
    email: user.email ?? user.id,
    viewerDisplayName,
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

  type GameMemberRpcRowResults = { user_id: string; email: string; display_name: string | null };
  const { data: emailRowsResults, error: emailErrResults } = await supabase.rpc(
    "get_game_member_emails",
    { p_game_id: game.id }
  );
  if (emailErrResults) return fromPostgrestError(emailErrResults as PostgrestError);

  const memberMapResults = new Map<string, { email: string; displayName: string | null }>();
  for (const row of (emailRowsResults ?? []) as GameMemberRpcRowResults[]) {
    memberMapResults.set(row.user_id, {
      email: row.email ?? row.user_id,
      displayName: row.display_name,
    });
  }

  const { data: rosterRows, error: rosterErr } = await supabase
    .from("game_members")
    .select("user_id, player_order")
    .eq("game_id", game.id);
  if (rosterErr) return fromPostgrestError(rosterErr as PostgrestError);

  const roster: GameResultsRosterRow[] = (rosterRows ?? [])
    .map((row) => {
      const uid = row.user_id as string;
      const m = memberMapResults.get(uid);
      return {
        userId: uid,
        playerOrder: row.player_order as number,
        email: m?.email ?? uid,
        displayName: m?.displayName ?? null,
      };
    })
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

  const rounds: GameResultsRound[] = roundsList.map((row) => {
    const normalizedAlbumUrl = normalizeOptionalHttpUrl((row.album_url as string | null) ?? null);
    return {
      id: row.id as string,
      roundNumber: row.round_number as number,
      albumName: row.album_name as string | null,
      artistName: row.artist_name as string | null,
      albumUrl: normalizedAlbumUrl.ok ? normalizedAlbumUrl.value : null,
      pickerId: row.created_by as string,
      reviews: reviewsByRound.get(row.id as string) ?? [],
    };
  });

  return ok({
    viewerId: user.id,
    email: user.email ?? user.id,
    viewerDisplayName,
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

export async function updateProfileDisplayName(
  displayName: string
): Promise<ActionResult<{ displayName: string | null }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const trimmed = displayName.trim();
  const stored = trimmed.length === 0 ? null : trimmed;
  if (stored && stored.length > 80) {
    return actionErr("invalid_input", "Display name must be 80 characters or fewer.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: stored,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return fromPostgrestError(error as PostgrestError);
  return ok({ displayName: stored });
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

export async function leaveGroup(groupId: string): Promise<ActionResult<void>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });

  if (error) return fromPostgrestError(error);
  return ok(undefined);
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
  const normalizedAlbumUrl = normalizeOptionalHttpUrl(albumUrl);
  if (!normalizedAlbumUrl.ok) {
    return actionErr("invalid_album_url", normalizedAlbumUrl.message);
  }

  const { data, error } = await supabase.rpc("submit_album", {
    p_game_id: gameId,
    p_album_name: albumName,
    p_artist_name: artistName,
    p_album_url: normalizedAlbumUrl.value ?? "",
  });

  if (error) return fromPostgrestError(error);
  return ok({ roundId: data as string });
}

export type GroupMembershipItem = {
  groupId: string;
  groupName: string;
  inviteCode: string;
  joinedAt: string;
  /** Number of current members in the group. Used to warn before leaving as last member. */
  memberCount: number;
};

/** Returns all groups the signed-in user belongs to, newest join first. */
export async function getMyGroups(): Promise<ActionResult<GroupMembershipItem[]>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  const { data: rows, error } = await supabase
    .from("group_members")
    .select("group_id, joined_at, groups(name, invite_code)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) return fromPostgrestError(error as PostgrestError);

  type GroupMemberRow = {
    group_id: string;
    joined_at: string;
    groups: { name: string; invite_code: string } | { name: string; invite_code: string }[] | null;
  };

  const parsed = (rows ?? []) as unknown as GroupMemberRow[];
  const groupIds = parsed.map((r) => r.group_id);

  // Count members per group (used to warn when leaving as the last member).
  const memberCountMap = new Map<string, number>();
  if (groupIds.length > 0) {
    const { data: countRows } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);
    for (const cr of (countRows ?? []) as { group_id: string }[]) {
      memberCountMap.set(cr.group_id, (memberCountMap.get(cr.group_id) ?? 0) + 1);
    }
  }

  const items: GroupMembershipItem[] = parsed.map((r) => {
    const g = Array.isArray(r.groups) ? r.groups[0] : r.groups;
    return {
      groupId: r.group_id,
      groupName: g?.name ?? "Unknown group",
      inviteCode: g?.invite_code ?? "",
      joinedAt: r.joined_at,
      memberCount: memberCountMap.get(r.group_id) ?? 1,
    };
  });

  return ok(items);
}

/** Returns up to 20 games the caller has played in, newest first. */
export async function getMyGameHistory(): Promise<ActionResult<GameHistoryItem[]>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionErr("unauthorized", "Sign in required.");

  // Get all game IDs this user belongs to (RLS scoped to caller).
  const { data: memberRows, error: memberErr } = await supabase
    .from("game_members")
    .select("game_id")
    .eq("user_id", user.id);
  if (memberErr) return fromPostgrestError(memberErr as PostgrestError);

  const gameIds = (memberRows ?? []).map((r) => r.game_id as string);
  if (gameIds.length === 0) return ok([]);

  // Fetch games + group names (RLS: only games the user is a member of).
  const { data: gamesData, error: gamesErr } = await supabase
    .from("games")
    .select("id, status, current_round, max_rounds, created_at, group_id, groups(name)")
    .in("id", gameIds)
    .order("created_at", { ascending: false })
    .limit(20);
  if (gamesErr) return fromPostgrestError(gamesErr as PostgrestError);

  type GameRow = {
    id: string;
    status: string;
    current_round: number;
    max_rounds: number;
    created_at: string;
    group_id: string;
    // PostgREST returns FK-to-one joins as a single object, not an array.
    groups: { name: string } | { name: string }[] | null;
  };

  const history: GameHistoryItem[] = ((gamesData ?? []) as unknown as GameRow[]).map((g) => {
    const grp = Array.isArray(g.groups) ? g.groups[0] : g.groups;
    return {
      gameId: g.id,
      groupId: g.group_id,
      groupName: grp?.name ?? "Unknown group",
      status: g.status,
      currentRound: g.current_round,
      maxRounds: g.max_rounds,
      createdAt: g.created_at,
    };
  });

  return ok(history);
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
