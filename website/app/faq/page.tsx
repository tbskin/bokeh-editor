import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about Bokeh: how it works, whether you need to be on camera, and who it is for.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "How is this different from CapCut or an AI video app?",
    a: "Those hand you tools to edit one clip at a time. Ours reads all your footage at once and makes the cut for you, then lets you direct it by chatting.",
  },
  {
    q: "Is this just more AI slop?",
    a: "The opposite is the point. You bring the ideas and your real voice. The tool handles the busywork and you make the calls. Nothing ships that is not yours.",
  },
  {
    q: "Do I have to be on camera?",
    a: "However you like. Talk to camera, record a voiceover, or both. Either way we build the reel around your footage and your real voice, so it stays yours instead of a template.",
  },
  {
    q: "Is this for a personal brand or for a business?",
    a: "Both. Founders, experts, and creators use the same flow to show up consistently without content becoming a second job.",
  },
  {
    q: "What can it actually do?",
    a: "Bring your clips and it cuts a post-ready vertical reel you fix by chatting. Over time it helps across the whole run, from finding the idea to seeing what landed.",
  },
];

const ld = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <main style={{ padding: "52px 0 104px" }}>
      <JsonLd data={ld} />
      <div className="article">
        <h1>FAQ</h1>
        <p className="lede">Straight answers about how Bokeh works.</p>
        <div style={{ marginTop: 12 }}>
          {faqs.map((f) => (
            <div key={f.q} style={{ marginTop: 30 }}>
              <h2 style={{ margin: "0 0 8px" }}>{f.q}</h2>
              <p style={{ margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
