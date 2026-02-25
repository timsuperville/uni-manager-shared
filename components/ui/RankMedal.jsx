import PropTypes from "prop-types";

/**
 * RankMedal
 *
 * A circular leaderboard rank indicator displaying a 1-indexed position number.
 * 1st place = gold, 2nd place = silver, 3rd place = bronze, 4th+ = neutral glass.
 *
 * Usage:
 *   <RankMedal rank={1} />           // gold  — 🥇
 *   <RankMedal rank={2} />           // silver — 🥈
 *   <RankMedal rank={3} size="sm" /> // bronze, small
 *   <RankMedal rank={7} />           // neutral (rank 7)
 *
 * @param {number} rank      — 1-indexed position (1 = 1st place)
 * @param {"sm"|"md"} size  — "sm" (24px) or "md" (32px, default)
 * @param {string} className — additional Tailwind layout classes (e.g. "shrink-0")
 */

const MEDAL_COLOURS = {
  1: "hsl(45, 90%, 50%)", // gold
  2: "hsl(0,   0%, 60%)", // silver
  3: "hsl(30, 80%, 50%)", // bronze
};

const NEUTRAL = "var(--glass-outline, rgba(255,255,255,0.18))";

const SIZE = {
  sm: { outer: "w-6 h-6", text: "text-xs" },
  md: { outer: "w-8 h-8", text: "text-sm" },
};

export function RankMedal({ rank, size = "md", className = "" }) {
  const { outer, text } = SIZE[size] ?? SIZE.md;
  const bg = MEDAL_COLOURS[rank] ?? NEUTRAL;

  return (
    <span
      className={`${outer} rounded-full inline-flex items-center justify-center font-bold text-white shrink-0 ${text} ${className}`}
      style={{ background: bg }}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

RankMedal.propTypes = {
  /** 1-indexed leaderboard position. 1 = gold, 2 = silver, 3 = bronze, 4+ = neutral. */
  rank: PropTypes.number.isRequired,
  /** Visual size of the medal. Default "md" (32 px). */
  size: PropTypes.oneOf(["sm", "md"]),
  /** Extra Tailwind layout or spacing classes applied to the outer element. */
  className: PropTypes.string,
};

export default RankMedal;
