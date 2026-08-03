import { BADGE_EMOJI, BADGE_LABEL, BADGE_THRESHOLDS, BadgeTier, getNextBadgeGoal } from "@/lib/badges";

export default function BadgeDisplay({ passedSongs }: { passedSongs: number }) {
  const nextGoal = getNextBadgeGoal(passedSongs);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        {BADGE_THRESHOLDS.slice()
          .reverse()
          .map(({ tier, songs, label }) => {
            const earned = passedSongs >= songs;
            return (
              <div
                key={tier}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-3 ${
                  earned ? "bg-amber-50 dark:bg-amber-950/30" : "bg-zinc-50 dark:bg-zinc-800/60"
                }`}
              >
                <span className={`text-3xl ${earned ? "" : "opacity-30 grayscale"}`}>
                  {BADGE_EMOJI[tier as BadgeTier]}
                </span>
                <span className={`text-xs font-semibold ${earned ? "text-amber-700 dark:text-amber-300" : "text-zinc-400"}`}>
                  {label}
                </span>
                <span className="text-[11px] text-zinc-400">{songs}곡</span>
              </div>
            );
          })}
      </div>
      <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-300">
        지금까지 <strong>{passedSongs}곡</strong> 통과했어요.
        {nextGoal
          ? ` ${BADGE_LABEL[nextGoal.tier]}까지 ${nextGoal.songsToGo}곡 남았어요!`
          : " 모든 배지를 획득했어요! 🎉"}
      </p>
    </div>
  );
}
