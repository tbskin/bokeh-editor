import { MonoLabel } from "./ui";

const FAQS = [
  {
    q: "How is this different from CapCut or an AI video app?",
    a: "Those give you tools to edit one clip at a time. Ours understands all your footage at once and makes the cut for you, then lets you direct it by chat.",
  },
  {
    q: "Isn't this just more AI slop?",
    a: "The opposite is the point. You bring the ideas and your real voice. The AI handles the busywork and you make the calls. Nothing ships that isn't yours.",
  },
  {
    q: "Do I have to be on camera?",
    a: "However you like. Talk to camera, record a voiceover, or both. Either way we build the reel around your footage and your real voice, so it stays authentically yours instead of a template.",
  },
  {
    q: "Is this for a personal brand, or for growing a business?",
    a: "Both. Founders, domain experts, and creators use the same flow to show up consistently without content becoming a second job.",
  },
  {
    q: "What can it actually do?",
    a: "Bring your clips and it cuts a post-ready vertical reel you refine by chat. It works across the whole lifecycle, from finding the idea to learning what landed, with you steering every call.",
  },
];

export function FAQ() {
  return (
    <section id="faq" style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 28px 120px" }}>
      <MonoLabel>faq</MonoLabel>
      <div style={{ marginTop: 24, borderTop: "1px solid var(--line)", maxWidth: 720 }}>
        {FAQS.map((f) => (
          <details key={f.q} style={{ borderBottom: "1px solid var(--line)" }}>
            <summary
              style={{
                cursor: "pointer",
                padding: "22px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                fontFamily: "var(--font-display), serif",
                fontSize: 22,
                lineHeight: 1.25,
              }}
            >
              <span>{f.q}</span>
              <span className="faq-plus" aria-hidden style={{ color: "var(--faint)", fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                +
              </span>
            </summary>
            <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "0 0 22px", maxWidth: 660 }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
