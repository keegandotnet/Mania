/** Public roster shape. Account email is intentionally never included. */
export type MemberRosterRow = {
  userId: string;
  displayName: string | null;
  playerOrder?: number;
};

export function memberLabel(viewerId: string, userId: string, roster: MemberRosterRow[]): string {
  const row = roster.find((r) => r.userId === userId);
  const name = row?.displayName?.trim();
  if (name) return name;
  if (userId === viewerId) return "You";
  const index = row?.playerOrder ?? roster.findIndex((r) => r.userId === userId);
  return index >= 0 ? `Player ${index + 1}` : "Player";
}
