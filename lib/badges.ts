export type BadgeTier = "gold" | "silver" | "bronze" | "none";

export const BADGE_THRESHOLDS: { tier: BadgeTier; songs: number; label: string }[] = [
  { tier: "gold", songs: 8, label: "금장" },
  { tier: "silver", songs: 5, label: "은장" },
  { tier: "bronze", songs: 3, label: "동장" },
];

export function getBadgeTier(passedSongCount: number): BadgeTier {
  for (const { tier, songs } of BADGE_THRESHOLDS) {
    if (passedSongCount >= songs) return tier;
  }
  return "none";
}

export function getNextBadgeGoal(passedSongCount: number): { tier: BadgeTier; songsToGo: number } | null {
  const remaining = [...BADGE_THRESHOLDS]
    .reverse()
    .find((b) => passedSongCount < b.songs);
  if (!remaining) return null;
  return { tier: remaining.tier, songsToGo: remaining.songs - passedSongCount };
}

export const BADGE_LABEL: Record<BadgeTier, string> = {
  gold: "금장",
  silver: "은장",
  bronze: "동장",
  none: "배지 없음",
};

export const BADGE_EMOJI: Record<BadgeTier, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
  none: "🎵",
};
