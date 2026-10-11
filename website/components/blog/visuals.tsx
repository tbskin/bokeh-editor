const figure = { margin: "36px 0" } as const;
const cap = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  color: "var(--faint)",
  textAlign: "center" as const,
  marginTop: 12,
  letterSpacing: "0.03em",
};

// Post: AI made content cheap — the perception gap.
export function GapBars() {
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 300" width="100%" role="img" aria-label="77 percent of marketers versus 33 percent of consumers, a 44 point gap.">
        <line x1="60" y1="250" x2="600" y2="250" stroke="var(--line-2)" strokeWidth="1" />
        <rect x="180" y="96" width="110" height="154" rx="4" fill="var(--text)" />
        <rect x="390" y="184" width="110" height="66" rx="4" fill="var(--accent)" />
        <text x="235" y="82" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="30" fill="var(--text)">77%</text>
        <text x="445" y="170" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="30" fill="var(--accent)">33%</text>
        <text x="235" y="274" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">MARKETERS</text>
        <text x="445" y="274" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">CONSUMERS</text>
        <line x1="345" y1="96" x2="345" y2="184" stroke="var(--accent)" strokeWidth="1" />
        <line x1="339" y1="96" x2="351" y2="96" stroke="var(--accent)" strokeWidth="1" />
        <line x1="339" y1="184" x2="351" y2="184" stroke="var(--accent)" strokeWidth="1" />
        <text x="333" y="144" textAnchor="end" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--accent-text)">44 pt gap</text>
      </svg>
      <figcaption style={cap}>What marketers think AI content does, versus what audiences actually feel.</figcaption>
    </figure>
  );
}

// Post: the editing tax — output bottlenecks at the edit.
export function BottleneckPipeline() {
  const nodes = [
    { x: 80, label: "Idea" },
    { x: 235, label: "Capture" },
    { x: 405, label: "Edit", hot: true },
    { x: 565, label: "Post" },
  ];
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 210" width="100%" role="img" aria-label="Pipeline of idea, capture, edit, post. Output bottlenecks at the edit step.">
        <defs>
          <marker id="bp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M1 1 L8 5 L1 9" fill="none" stroke="var(--faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <line x1="132" y1="100" x2="182" y2="100" stroke="var(--faint)" strokeWidth="1.5" markerEnd="url(#bp-arr)" />
        <line x1="290" y1="100" x2="348" y2="100" stroke="var(--faint)" strokeWidth="1.5" markerEnd="url(#bp-arr)" />
        <line x1="462" y1="100" x2="512" y2="100" stroke="var(--faint)" strokeWidth="1.5" markerEnd="url(#bp-arr)" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={[303, 311, 319, 327][i]} y={[86, 90, 94, 98][i]} width="12" height="18" rx="2" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1" />
        ))}
        {nodes.map((n) => (
          <g key={n.label}>
            <rect x={n.x - 55} y="78" width="110" height="44" rx="22" fill="var(--surface)" stroke={n.hot ? "var(--accent)" : "var(--line-2)"} strokeWidth={n.hot ? 1.75 : 1} />
            <text x={n.x} y="105" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="13" fill={n.hot ? "var(--accent-text)" : "var(--text)"}>{n.label}</text>
          </g>
        ))}
        <text x="405" y="150" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" letterSpacing="0.1em" fill="var(--accent-text)">BOTTLENECK</text>
      </svg>
      <figcaption style={cap}>Output is capped by the slowest step. For most people, that is the edit.</figcaption>
    </figure>
  );
}

// Post: consistency is a systems problem — the loop.
const LOOP_NODES = [
  { x: 230, y: 80, label: "Idea" },
  { x: 372.66, y: 183.65, label: "Capture" },
  { x: 318.17, y: 351.35, label: "Edit" },
  { x: 141.83, y: 351.35, label: "Post" },
  { x: 87.34, y: 183.65, label: "Learn" },
];
const LOOP_ARCS = [
  "M271.34 85.80 A150 150 0 0 1 354.35 146.12",
  "M379.91 224.76 A150 150 0 0 1 348.20 322.36",
  "M281.30 370.96 A150 150 0 0 1 178.70 370.96",
  "M111.80 322.36 A150 150 0 0 1 80.09 224.76",
  "M105.65 146.12 A150 150 0 0 1 188.66 85.80",
];
export function ContentLoop() {
  return (
    <figure style={figure}>
      <svg viewBox="0 20 460 385" width="100%" style={{ maxWidth: 360, display: "block", margin: "0 auto" }} role="img" aria-label="The content loop: idea, capture, edit, post, learn, then back to idea.">
        <defs>
          <marker id="lp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
          </marker>
        </defs>
        <circle cx="230" cy="230" r="150" fill="none" stroke="var(--line)" strokeWidth="1" />
        {LOOP_ARCS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--accent)" strokeWidth="1.75" markerEnd="url(#lp-arr)" />
        ))}
        {LOOP_NODES.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="42" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1.5" />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="13" fill="var(--text)">{n.label}</text>
          </g>
        ))}
      </svg>
      <figcaption style={cap}>Content is a loop. The last step, learning, feeds the first.</figcaption>
    </figure>
  );
}

// Post: the first three seconds — retention.
export function RetentionCurve() {
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 290" width="100%" role="img" aria-label="Retention over time. With a hook, viewers stay. Without one, most leave in the first three seconds.">
        <rect x="60" y="50" width="54" height="200" fill="var(--accent)" opacity="0.09" />
        <line x1="60" y1="250" x2="600" y2="250" stroke="var(--line-2)" strokeWidth="1" />
        <text x="50" y="60" textAnchor="end" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--faint)">100%</text>
        <text x="50" y="253" textAnchor="end" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--faint)">0%</text>
        <text x="87" y="270" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--accent-text)">first 3s</text>
        <path d="M60 60 C 220 78, 420 108, 600 122" fill="none" stroke="var(--text)" strokeWidth="2.5" />
        <path d="M60 60 C 88 138, 106 172, 114 178 C 260 196, 450 204, 600 208" fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="5 5" />
        <rect x="420" y="44" width="14" height="3" fill="var(--text)" />
        <text x="442" y="50" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--text)">with a hook</text>
        <rect x="420" y="66" width="14" height="3" fill="var(--faint)" />
        <text x="442" y="72" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">no hook</text>
      </svg>
      <figcaption style={cap}>Most of the drop-off happens in the first three seconds.</figcaption>
    </figure>
  );
}

// Post: consistency beats polish — steady compounding vs sporadic spikes.
export function ConsistencyCompounds() {
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 300" width="100%" role="img" aria-label="Following over time. A rough but consistent account compounds steadily upward. A polished but sporadic account stays flat with two short-lived spikes.">
        <line x1="60" y1="258" x2="600" y2="258" stroke="var(--line-2)" strokeWidth="1" />
        <text x="60" y="44" textAnchor="start" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--faint)">following</text>
        <text x="600" y="278" textAnchor="end" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--faint)">time</text>
        <path d="M60 244 L150 242 L200 152 L250 240 L360 238 L420 134 L470 238 L600 236" fill="none" stroke="var(--faint)" strokeWidth="2" strokeDasharray="5 5" />
        <path d="M60 246 C 320 240, 470 166, 600 76" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <text x="420" y="122" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--muted)">moonshot</text>
        <rect x="352" y="52" width="14" height="3" fill="var(--accent)" />
        <text x="374" y="58" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--text)">rough, every week</text>
        <rect x="352" y="74" width="14" height="3" fill="var(--faint)" />
        <text x="374" y="80" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">polished, now and then</text>
      </svg>
      <figcaption style={cap}>The steady line compounds. The spikes are the exception, not the plan.</figcaption>
    </figure>
  );
}

// Post: distribute what you have — one recording, many clips.
export function RepurposeFanout() {
  const clips = [
    { x: 440, y: 42 },
    { x: 520, y: 58 },
    { x: 440, y: 132 },
    { x: 520, y: 148 },
    { x: 440, y: 222 },
    { x: 520, y: 202 },
  ];
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 300" width="100%" role="img" aria-label="One recording fanning out into many short clips.">
        {clips.map((c, i) => (
          <line key={i} x1="200" y1="150" x2={c.x} y2={c.y + 38} stroke="var(--accent)" strokeWidth="1" opacity="0.55" />
        ))}
        <rect x="40" y="105" width="160" height="90" rx="10" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1.5" />
        <text x="120" y="145" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="13" fill="var(--text)">one</text>
        <text x="120" y="166" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="13" fill="var(--text)">recording</text>
        {clips.map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={c.y} width="48" height="76" rx="6" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="1" />
            <path d={`M${c.x + 20} ${c.y + 32} L${c.x + 32} ${c.y + 38} L${c.x + 20} ${c.y + 44} z`} fill="var(--accent)" />
          </g>
        ))}
        <text x="512" y="286" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">8 to 12 clips</text>
      </svg>
      <figcaption style={cap}>Film once. One recording becomes a week of posts.</figcaption>
    </figure>
  );
}

// Post: the completion rate trap. Seconds watched vs percent finished.
export function WatchTimeBars() {
  return (
    <figure style={figure}>
      <svg viewBox="0 0 640 300" width="100%" role="img" aria-label="Two bars of seconds watched. A short clip watched fully banks 18 seconds. A longer clip watched to 60 percent banks 25 seconds, seven more.">
        <line x1="60" y1="250" x2="600" y2="250" stroke="var(--line-2)" strokeWidth="1" />
        <rect x="180" y="128" width="110" height="122" rx="4" fill="var(--text)" />
        <rect x="390" y="80" width="110" height="170" rx="4" fill="var(--accent)" />
        <text x="235" y="114" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="30" fill="var(--text)">18s</text>
        <text x="445" y="66" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="30" fill="var(--accent)">25s</text>
        <text x="235" y="274" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">0:18 CLIP · 100% SEEN</text>
        <text x="445" y="274" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="12" fill="var(--muted)">0:41 CLIP · 60% SEEN</text>
        <line x1="345" y1="80" x2="345" y2="128" stroke="var(--accent)" strokeWidth="1" />
        <line x1="339" y1="80" x2="351" y2="80" stroke="var(--accent)" strokeWidth="1" />
        <line x1="339" y1="128" x2="351" y2="128" stroke="var(--accent)" strokeWidth="1" />
        <text x="333" y="108" textAnchor="end" fontFamily="var(--font-mono), monospace" fontSize="11" fill="var(--accent-text)">+7s watched</text>
      </svg>
      <figcaption style={cap}>Seconds actually watched. The longer clip is only 60 percent finished and still wins.</figcaption>
    </figure>
  );
}
