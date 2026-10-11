import { MonoLabel } from "./ui";

const STEPS = [
  { n: "01", t: "You upload your clips", d: "Everything you shot, plus a voiceover or your on-camera takes." },
  { n: "02", t: "The AI understands and cuts", d: "It works out what is in every clip, stitches your story in order, and drops whatever does not belong." },
  { n: "03", t: "You get a reel to work with", d: "Polished, post-ready, captioned. Reshape any part just by chatting." },
];

export function HowItWorks() {
  return (
    <section id="how" style={{ maxWidth: 1080, margin: "0 auto", padding: "120px 28px 96px" }}>
      <MonoLabel>how it works</MonoLabel>
      <h2
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 400,
          fontSize: "clamp(30px, 4vw, 48px)",
          lineHeight: 1.1,
          margin: "14px 0 16px",
          maxWidth: 720,
        }}
      >
        Clips in. A finished reel out.
      </h2>
      <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.6, maxWidth: 640, margin: "0 0 48px" }}>
        The AI actually watches your footage and edits it like a human would, only faster.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 48 }}>
        {STEPS.map((s) => (
          <div key={s.n}>
            <div style={{ fontFamily: "var(--font-display), serif", fontSize: 44, color: "var(--accent)" }}>{s.n}</div>
            <h3 style={{ fontFamily: "var(--font-display), serif", fontWeight: 400, fontSize: 24, margin: "6px 0 8px" }}>
              {s.t}
            </h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
