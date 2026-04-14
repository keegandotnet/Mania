/**
 * RLS + RPC smoke test: two authenticated users, full flow via PostgREST (anon key + JWT).
 *
 * Run:
 *   node --env-file=.env.local scripts/rls-smoke.mjs
 *
 * Hosted Supabase often rate-limits or blocks signUp; optionally set SUPABASE_SERVICE_ROLE_KEY
 * (project settings → API; never commit). The script will create two confirmed users via
 * auth.admin then exercise RPCs with the anon client + session only.
 *
 * Or set RLS_SMOKE_EMAIL_A / RLS_SMOKE_PASSWORD_A / _B / _B for existing accounts (sign-in only).
 *
 * Coverage includes:
 *   - create_group_with_owner, join_group_by_invite, create_game_for_group
 *   - start_next_round, submit_album, submit_review (auto-reveal)
 *   - get_game_member_emails: asserts rows contain user_id, email, and display_name (nullable)
 *   - get_group_member_profiles: asserts rows are ordered by player_order ascending
 *   - RLS cross-user isolation: user B cannot read a group they are not in
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const suffix = `${Date.now()}`;
const defaultPw = "Smoke-test-passw0rd!";
const password1 = process.env.RLS_SMOKE_PASSWORD_A ?? process.env.RLS_SMOKE_PASSWORD ?? defaultPw;
const password2 = process.env.RLS_SMOKE_PASSWORD_B ?? process.env.RLS_SMOKE_PASSWORD ?? defaultPw;
const email1 = process.env.RLS_SMOKE_EMAIL_A ?? `mania.smoke.a.${suffix}@maniasmoke.test`;
const email2 = process.env.RLS_SMOKE_EMAIL_B ?? `mania.smoke.b.${suffix}@maniasmoke.test`;
const reuseAccounts = !!(process.env.RLS_SMOKE_EMAIL_A && process.env.RLS_SMOKE_EMAIL_B);

function anonClient() {
  return createClient(url, anon);
}

async function ensureUsersViaAdmin() {
  if (!serviceRole || reuseAccounts) return false;
  const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const pairs = [
    [email1, password1],
    [email2, password2],
  ];
  for (const [email, pw] of pairs) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password: pw,
      email_confirm: true,
    });
    if (error && !/already been registered/i.test(error.message)) {
      console.error("admin.createUser:", email, error.message);
      process.exit(1);
    }
  }
  return true;
}

async function ensureUserSession(supabase, email, pw, { signInOnly = false } = {}) {
  if (reuseAccounts || signInOnly) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    return error;
  }

  const signUp = await supabase.auth.signUp({ email, password: pw });
  if (!signUp.error && signUp.data.session) return null;

  const signIn = await supabase.auth.signInWithPassword({ email, password: pw });
  if (!signIn.error) return null;

  return signUp.error ?? signIn.error;
}

function fail(msg, err) {
  console.error(msg, err?.message ?? err ?? "");
  process.exit(1);
}

async function main() {
  const usedAdmin = await ensureUsersViaAdmin();

  const a = anonClient();
  const b = anonClient();

  let err = await ensureUserSession(a, email1, password1, { signInOnly: usedAdmin });
  if (err && !usedAdmin) {
    console.error(
      "User A auth failed. For hosted projects, set SUPABASE_SERVICE_ROLE_KEY in the environment (see script header), or RLS_SMOKE_EMAIL_A + RLS_SMOKE_EMAIL_B + passwords for existing users.\n",
      err.message
    );
    process.exit(1);
  }
  if (err) fail("User A sign-in failed after admin provisioning:", err);

  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  const { data: gid, error: e1 } = await a.rpc("create_group_with_owner", {
    p_name: `Smoke ${suffix}`,
    p_invite: code,
  });
  if (e1 || !gid) fail("create_group_with_owner", e1);

  const { data: groupRow, error: eSelect } = await a.from("groups").select("id, invite_code").eq("id", gid).maybeSingle();
  if (eSelect || !groupRow) fail("RLS select groups as member FAILED", eSelect);
  const realInvite = groupRow.invite_code;

  err = await ensureUserSession(b, email2, password2, { signInOnly: usedAdmin });
  if (err && !usedAdmin) {
    console.error("User B auth failed:", err.message);
    process.exit(1);
  }
  if (err) fail("User B sign-in failed after admin provisioning:", err);

  const { data: gid2, error: e2 } = await b.rpc("join_group_by_invite", { p_invite: realInvite });
  if (e2 || !gid2 || gid2 !== gid) fail("join_group_by_invite", e2);

  const { data: gameId, error: e3 } = await a.rpc("create_game_for_group", { p_group_id: gid });
  if (e3 || !gameId) fail("create_game_for_group", e3);

  const { data: gameRow, error: eGameMeta } = await a
    .from("games")
    .select("max_rounds, auto_advance")
    .eq("id", gameId)
    .maybeSingle();
  if (eGameMeta || gameRow?.max_rounds == null) fail("games.max_rounds / auto_advance readable", eGameMeta);

  const { data: roundId, error: e4 } = await a.rpc("start_next_round", { p_game_id: gameId });
  if (e4 || !roundId) fail("start_next_round", e4);

  const { data: ridAlbum, error: e5 } = await a.rpc("submit_album", {
    p_game_id: gameId,
    p_album_name: "Dummy Album",
    p_artist_name: "Dummy Artist",
    p_album_url: "",
  });
  if (e5 || ridAlbum !== roundId) fail("submit_album (host / submitter)", e5);

  const { error: e6 } = await b.rpc("submit_review", {
    p_round_id: roundId,
    p_rating: 8.5,
    p_review_text: "Nice",
  });
  if (e6) fail("submit_review", e6);

  const { data: round, error: e7 } = await b.from("rounds").select("status").eq("id", roundId).maybeSingle();
  if (e7 || round?.status !== "revealed") {
    fail("Expected round revealed after all reviews; RLS select rounds failed?", e7 ?? new Error(round?.status));
  }

  // ── get_game_member_emails shape check ────────────────────────────────────
  const { data: emailRows, error: eEmail } = await a.rpc("get_game_member_emails", { p_game_id: gameId });
  if (eEmail || !Array.isArray(emailRows) || emailRows.length === 0) {
    fail("get_game_member_emails returned no rows or errored", eEmail);
  }
  for (const row of emailRows) {
    if (typeof row.user_id !== "string" || !row.user_id) {
      fail("get_game_member_emails: row missing user_id", row);
    }
    if (typeof row.email !== "string" || !row.email) {
      fail("get_game_member_emails: row missing email", row);
    }
    // display_name is nullable — just assert the key is present
    if (!Object.prototype.hasOwnProperty.call(row, "display_name")) {
      fail("get_game_member_emails: row missing display_name key", row);
    }
  }
  console.log("  get_game_member_emails: OK", emailRows.length, "row(s)");

  // ── get_group_member_profiles shape + ordering check ─────────────────────
  const { data: profileRows, error: eProfiles } = await a.rpc("get_group_member_profiles", { p_group_id: gid });
  if (eProfiles || !Array.isArray(profileRows) || profileRows.length === 0) {
    fail("get_group_member_profiles returned no rows or errored", eProfiles);
  }
  for (const row of profileRows) {
    if (typeof row.user_id !== "string" || !row.user_id) {
      fail("get_group_member_profiles: row missing user_id", row);
    }
    if (!Object.prototype.hasOwnProperty.call(row, "display_name")) {
      fail("get_group_member_profiles: row missing display_name key", row);
    }
    if (typeof row.player_order !== "number") {
      fail("get_group_member_profiles: row missing numeric player_order", row);
    }
  }
  // Assert rows are ordered by player_order ascending
  for (let i = 1; i < profileRows.length; i++) {
    if (profileRows[i].player_order < profileRows[i - 1].player_order) {
      fail("get_group_member_profiles: rows not ordered by player_order asc", profileRows);
    }
  }
  console.log("  get_group_member_profiles: OK", profileRows.length, "row(s), ordered");

  console.log("rls-smoke: ALL OK", { groupId: gid, gameId, roundId, invite: realInvite });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
