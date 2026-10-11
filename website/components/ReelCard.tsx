import type { Reel } from "@/lib/reels";

export function ReelCard({ reel }: { reel: Reel }) {
  return (
    <div className="reel-card">
      <img
        src={reel.src}
        alt=""
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* center play affordance */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <span style={{ fontSize: 30, color: "rgba(255,255,255,0.92)", textShadow: "0 1px 10px rgba(0,0,0,0.55)" }}>&#9654;</span>
      </div>
      {/* Clearly label the placeholder artwork. */}
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          color: "#fff",
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          gap: 5,
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: 9 }}>&#9654;</span>
        <span>{reel.views}</span>
      </div>
    </div>
  );
}
