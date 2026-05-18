type RankMedalSize = 'sm' | 'md';

interface RankMedalProps {
  /** 1-indexed leaderboard position. 1 = gold, 2 = silver, 3 = bronze, 4+ = neutral. */
  rank: number;
  /** Visual size. Default "md" (32 px). */
  size?: RankMedalSize;
  /** Extra Tailwind layout classes. */
  className?: string;
}

const MEDAL_COLOURS: Record<number, string> = {
  1: 'hsl(45, 90%, 50%)',
  2: 'hsl(0, 0%, 60%)',
  3: 'hsl(30, 80%, 50%)'
};
const NEUTRAL = 'var(--glass-outline, rgba(255,255,255,0.18))';

const SIZE: Record<RankMedalSize, { outer: string; text: string }> = {
  sm: { outer: 'w-6 h-6', text: 'text-xs' },
  md: { outer: 'w-8 h-8', text: 'text-sm' }
};

export function RankMedal({
  rank,
  size = 'md',
  className = ''
}: RankMedalProps) {
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

export default RankMedal;
