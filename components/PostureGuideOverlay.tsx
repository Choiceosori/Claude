import { InstrumentGuide } from "@/lib/instrumentGuides";

/**
 * Grid + silhouette overlay shown on top of the live camera preview so a
 * student can line up their posture before recording. Purely visual — it is
 * never baked into the recorded video.
 */
export default function PostureGuideOverlay({ guide }: { guide: InstrumentGuide }) {
  const isPortrait = guide.orientation === "portrait";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* rule-of-thirds grid */}
      {[33.33, 66.66].map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="white" strokeOpacity={0.35} strokeWidth={0.3} />
      ))}
      {[33.33, 66.66].map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="white" strokeOpacity={0.35} strokeWidth={0.3} />
      ))}

      {/* body/instrument framing hint */}
      {isPortrait ? (
        <>
          <ellipse cx={50} cy={22} rx={11} ry={13} stroke="#4ade80" strokeWidth={0.8} fill="none" strokeDasharray="2,1.5" />
          <path
            d="M 26 96 C 26 60, 34 46, 50 46 C 66 46, 74 60, 74 96"
            stroke="#4ade80"
            strokeWidth={0.8}
            fill="none"
            strokeDasharray="2,1.5"
          />
        </>
      ) : (
        <>
          <ellipse cx={50} cy={18} rx={9} ry={10.5} stroke="#4ade80" strokeWidth={0.8} fill="none" strokeDasharray="2,1.5" />
          <path
            d="M 18 92 C 18 58, 30 40, 50 40 C 70 40, 82 58, 82 92"
            stroke="#4ade80"
            strokeWidth={0.8}
            fill="none"
            strokeDasharray="2,1.5"
          />
        </>
      )}

      <rect x={1} y={1} width={98} height={98} rx={3} stroke="white" strokeOpacity={0.5} strokeWidth={0.5} fill="none" />
    </svg>
  );
}
