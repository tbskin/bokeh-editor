export type Reel = { id: string; src: string; views: string };

// Original abstract illustrations, not customer footage or claimed view counts.
export const REELS: Reel[] = Array.from({ length: 12 }, (_, index) => ({
  id: `r${index + 1}`, src: `/illustrations/reel-${index % 4}.svg`, views: "Illustration",
}));

export function columnPlan(reels: Reel[], columns: number) {
  const cols: Reel[][] = Array.from({ length: columns }, () => []);
  reels.forEach((r, i) => cols[i % columns].push(r));
  return cols.map((reels, i) => ({ reels, durationSec: 34 + i * 8, reverse: i % 2 === 1 }));
}
