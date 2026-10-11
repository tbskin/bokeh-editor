import { REELS, columnPlan } from "@/lib/reels";
import { ReelCard } from "./ReelCard";

export function ReelsWall({ columns = 4 }: { columns?: number }) {
  const cols = columnPlan(REELS, columns);
  return (
    <div className="wall" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-hidden>
      {cols.map((col, i) => (
        <div
          key={i}
          className="wall-col"
          data-reverse={col.reverse}
          style={{ ["--dur"]: `${col.durationSec}s` } as React.CSSProperties}
        >
          {/* content duplicated 2x so the -50% drift loops seamlessly */}
          {[...col.reels, ...col.reels].map((reel, j) => (
            <ReelCard key={`${reel.id}-${j}`} reel={reel} />
          ))}
        </div>
      ))}
    </div>
  );
}
