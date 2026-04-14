/** Shared roster row shape for display-name + email fallback labels. */
export type MemberRosterRow = {
  userId: string;
  email: string;
  displayName: string | null;
};

export function memberLabel(viewerId: string, userId: string, roster: MemberRosterRow[]): string {
  const row = roster.find((r) => r.userId === userId);
  const name = row?.displayName?.trim();
  const email = row?.email ?? "";
  const fallback = email || (userId === viewerId ? "You" : "Teammate");
  return name || fallback;
}
