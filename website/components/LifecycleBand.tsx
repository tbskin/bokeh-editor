const NODES = [
  { label: "Idea", x: 230, y: 80 },
  { label: "Script", x: 372.66, y: 183.65 },
  { label: "Film", x: 318.17, y: 351.35 },
  { label: "Edit", x: 141.83, y: 351.35 },
  { label: "Post", x: 87.34, y: 183.65 },
];

// Clockwise arcs between consecutive nodes on the r=150 ring (16 deg gap either side of each node).
const ARCS = [
  "M271.34 85.80 A150 150 0 0 1 354.35 146.12",
  "M379.91 224.76 A150 150 0 0 1 348.20 322.36",
  "M281.30 370.96 A150 150 0 0 1 178.70 370.96",
  "M111.80 322.36 A150 150 0 0 1 80.09 224.76",
  "M105.65 146.12 A150 150 0 0 1 188.66 85.80",
];

function Flywheel() {
  return (
    <svg
      viewBox="0 0 460 460"
      width="100%"
      style={{ maxWidth: 440, display: "block", margin: "0 auto", overflow: "visible" }}
      role="img"
      aria-label="The content lifecycle as a flywheel: idea, script, film, edit, post, looping back with you at the center."
    >
      <defs>
        <marker id="fw-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* rim track */}
      <circle cx="230" cy="230" r="150" fill="none" stroke="var(--line)" strokeWidth="1" />

      {/* spokes (covered at both ends by the hub + nodes drawn on top) */}
      {NODES.map((n) => (
        <line key={`s-${n.label}`} x1="230" y1="230" x2={n.x} y2={n.y} stroke="var(--line)" strokeWidth="1" />
      ))}

      {/* directional flow */}
      {ARCS.map((d, i) => (
        <path key={`a-${i}`} d={d} fill="none" stroke="var(--accent)" strokeWidth="1.75" markerEnd="url(#fw-arrow)" />
      ))}

      {/* hub: you at the center */}
      <circle cx="230" cy="230" r="52" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1" />
      <text x="230" y="238" textAnchor="middle" fontFamily="var(--font-display), serif" fontStyle="italic" fontSize="26" fill="var(--accent)">
        you
      </text>

      {/* stage nodes */}
      {NODES.map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="42" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1.5" />
          <text
            x={n.x}
            y={n.y + 5}
            textAnchor="middle"
            fontFamily="var(--font-mono), monospace"
            fontSize="14"
            letterSpacing="0.02em"
            fill="var(--text)"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LifecycleBand() {
  return (
    <section id="vision" style={{ maxWidth: 1080, margin: "0 auto", padding: "96px 28px 110px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 400,
          fontSize: "clamp(30px, 4vw, 48px)",
          lineHeight: 1.1,
          margin: "0 0 18px",
          maxWidth: 760,
        }}
      >
        We built this entire system AI-native, from the ground up.
      </h2>
      <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6, maxWidth: 660, margin: "0 0 64px" }}>
        Not AI bolted onto an editor. Every stage, from the first idea to what you post and what you learn, was
        built around AI from day one, with you in charge of every call. That&rsquo;s how we kill AI slop instead of
        mass-producing it.
      </p>
      <Flywheel />
    </section>
  );
}
