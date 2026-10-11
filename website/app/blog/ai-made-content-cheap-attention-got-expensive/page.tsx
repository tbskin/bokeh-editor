import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { GapBars } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("ai-made-content-cheap-attention-got-expensive")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${post.slug}` },
};

const ld = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.date,
  author: { "@type": "Person", name: post.author },
  publisher: { "@type": "Organization", name: "Bokeh", legalName: "TourByte Inc." },
  image: "https://www.trybokeh.com/opengraph-image.png",
  mainEntityOfPage: `https://www.trybokeh.com/blog/${post.slug}`,
};

export default function Page() {
  return (
    <>
      <JsonLd data={ld} />
      <Article title={post.title} date={post.date} author={post.author}>
        <p>
          Making a video used to cost something. Time, mostly. You shot it, trimmed it, wrote the captions, and posted
          it, and the friction of all that work quietly kept the feed from filling up too fast. That friction is mostly
          gone now. A person can generate a script, a voice, a face, and a finished clip faster than they can read this
          paragraph.
        </p>
        <p>
          You would think that is a gift to creators. So far it has been closer to a trap. When anyone can produce
          endless content, the content itself stops being scarce. Attention becomes the scarce thing, and attention has
          gotten much harder to win.
        </p>

        <h2>The audience already noticed</h2>
        <p>
          The goodwill ran out fast. In 2023 most people said they were fine with AI-made content. By 2026, consumer
          preference for it has{" "}
          <a href="https://autofaceless.ai/blog/ai-content-creation-statistics-2026" target="_blank" rel="noopener noreferrer">
            fallen to roughly 26 percent, down from about 60 percent
          </a>{" "}
          three years earlier. Engagement tends to{" "}
          <a href="https://www.techmagazines.net/why-authentic-content-is-winning-over-ai-generated-content-in-2026/" target="_blank" rel="noopener noreferrer">
            drop around 12 percent
          </a>{" "}
          the moment viewers realize a machine made something, and more than half say they pull back when they merely
          suspect it.
        </p>
        <p>
          There is a quieter number worth sitting with. Around 77 percent of marketers believe AI produces content that
          connects emotionally. Only about 33 percent of consumers{" "}
          <a href="https://www.techmagazines.net/why-authentic-content-is-winning-over-ai-generated-content-in-2026/" target="_blank" rel="noopener noreferrer">
            agree
          </a>
          . That is a 44 point gap between the people making the stuff and the people it is aimed at. One side thinks it
          is working. The other side is scrolling past.
        </p>
        <GapBars />

        <h2>Why the flood does not land</h2>
        <p>
          The problem is not that AI writes badly. It often writes cleanly. The problem is that clean and average are
          the same thing when everyone is using the same tools trained on the same internet. Generative models are built
          to produce the most likely next thing, and the most likely next thing is, by definition, what everyone else is
          already making. Point a million people at the same models and you get a million versions of the middle.
        </p>
        <p>
          Audiences are very good at smelling the middle. They cannot always name why a video feels hollow, but they
          feel it, and they keep scrolling. What reads as AI slop is rarely a grammar problem. It is the absence of a
          person. No specific opinion, no odd detail, no point of view that could only have come from one human who was
          actually there.
        </p>

        <h2>What still gets watched</h2>
        <p>
          Look at what does break through and it is almost always the opposite of generic. A take you have not heard. A
          story only that person could tell. A rough clip with a real face saying something true. The signal is not
          production polish. It is evidence of a human with a point of view.
        </p>
        <p>
          This is good news, actually. It means the bar for standing out did not rise. If anything it got clearer. In a
          feed full of competent sameness, the scarce and valuable thing is a voice, and that is the one input a model
          cannot generate for you, because it does not have your life, your taste, or your reason for caring.
        </p>

        <h2>The line worth drawing</h2>
        <p>
          So the useful question is not whether to use AI. Most people already settled that. More than ninety percent of
          marketers plan to use it, and it is{" "}
          <a href="https://autofaceless.ai/blog/ai-content-creation-statistics-2026" target="_blank" rel="noopener noreferrer">
            becoming as ordinary as spellcheck
          </a>
          . The useful question is which parts of the work you hand over and which parts you guard.
        </p>
        <p>
          A rough division that holds up. Safe to automate: the grunt work, meaning the cutting, trimming, captioning,
          resizing, and turning one long recording into ten clips. That is labor, not authorship. Nobody watches a video
          because the captions were typed by a human. Keep human: the parts that carry the point of view, meaning the
          idea, the angle, the actual words you believe, and the choice of what to show and what to cut.
        </p>
        <p>
          The failure mode of the last few years is people automating the second bucket. They let the machine pick the
          topic, write the take, and speak in a synthetic voice, then wonder why it vanishes into the feed. The move
          that works is the reverse. Automate the process. Protect the personality.
        </p>

        <h2>Does it actually scale?</h2>
        <p>
          Partly, and the part that does not is the whole point. The mechanical work scales beautifully. One recording
          can become a week of posts with almost no extra effort, which is a real unlock for anyone who has felt their
          pipeline clog at the editing step.
        </p>
        <p>
          The human layer does not scale, and it never will. You cannot ten-times your own taste or borrow someone
          else&apos;s lived experience. That sounds like a limit. It is actually the moat. Automation drove the cost of
          average content to zero, which means average content is now worth about zero. A real perspective and a real
          voice are the only things left with any value. The creators who win the next few years will not be the ones
          who automate the most. They will be the ones who automate the boring parts fast enough to spend all their time
          on the parts that cannot be faked.
        </p>
        <p>
          Attention got expensive because content got cheap. The way through is not to make more. It is to make sure the
          expensive, human part is still in there.
        </p>
      </Article>
    </>
  );
}
