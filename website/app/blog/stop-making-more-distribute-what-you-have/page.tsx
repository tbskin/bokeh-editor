import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { RepurposeFanout } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("stop-making-more-distribute-what-you-have")!;

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
          When growth stalls, the reflex is always the same. Make more. Post more often, film more clips, come up with
          more ideas. It feels like the responsible answer, so people bury themselves in a production schedule and burn
          out inside a month. Most of the time it is the wrong answer, because the problem was never that you made too
          little. It is that almost no one saw what you already made.
        </p>
        <p>
          Look at your own back catalog honestly. Somewhere in there is a video with a genuinely good idea that went out
          once, caught a few hundred views, and then vanished forever. You treated it as spent. It was not spent. It was
          barely opened.
        </p>

        <h2>A surplus of ideas, a shortage of reach</h2>
        <p>
          Most creators do not have a creation problem. They have a distribution problem wearing a creation problem&apos;s
          clothes. The ideas are fine. The reach is thin, because each idea gets exactly one shot on one platform on one
          day, and if the timing is off or the algorithm shrugs, that is the end of it. A good thing dies quietly and you
          respond by making another good thing that will probably die the same way.
        </p>
        <p>
          This is why the highest leverage move is usually not the next idea. It is getting more out of the last one. The
          data backs this up plainly. Marketers who systematically{" "}
          <a href="https://autofaceless.ai/blog/content-repurposing-statistics-2026" target="_blank" rel="noopener noreferrer">
            repurpose content see about a 40 percent increase in output
          </a>{" "}
          without a matching increase in the hours they put in. That gap, more output for the same effort, is the whole
          opportunity, and it comes from spreading what exists rather than starting from scratch every time.
        </p>

        <h2>One recording, many posts</h2>
        <p>
          Here is the mechanic. The expensive part of content is not the export. It is you showing up and saying
          something real. That part is worth doing once and using many times. A single decent recording holds enough
          material for a week of posts if you stop treating it as one video and start treating it as raw footage.
        </p>
        <RepurposeFanout />
        <p>
          One sit down becomes a set of short clips, each built around a different moment or idea inside it. Post them
          across the week, across platforms, in different cuts. The person only had to be interesting once. The reach
          multiplies without the effort multiplying, which is exactly the trade you want. And it is already how most of
          the field operates. Nearly{" "}
          <a href="https://autofaceless.ai/blog/content-repurposing-statistics-2026" target="_blank" rel="noopener noreferrer">
            half of marketing teams reuse the same core content across platforms
          </a>
          , while a smaller share still builds something unique for every channel from nothing.
        </p>

        <h2>Repurposing is not reposting</h2>
        <p>
          One caution, because this is where it goes wrong. Repurposing is not dumping the identical file onto five apps
          and hoping. Each platform has its own shape, its own pace, its own idea of a good opening. The same core moment
          becomes a fast punchy cut in one place and a slower explainer in another. The idea is reused. The packaging is
          not. Lazy cross posting reads as lazy, and audiences feel it immediately.
        </p>
        <p>
          The difference is small in effort and large in result. You are not making five different things. You are making
          one thing, then tailoring it five ways, which is a fraction of the work and reaches five audiences that would
          never have overlapped. Businesses leaning on tools to do this well report{" "}
          <a href="https://autofaceless.ai/blog/content-repurposing-statistics-2026" target="_blank" rel="noopener noreferrer">
            higher returns from the same content spend
          </a>
          , mostly because the content stops being a one time event.
        </p>

        <h2>Why this compounds</h2>
        <p>
          Distribution beats creation for a reason that is easy to miss. Creation is linear. Each new video costs the
          full price again, the idea, the shoot, the edit. Distribution is closer to free. Once the expensive part
          exists, every additional cut and every additional platform is cheap, and each one is another chance for the
          idea to find the people it was actually for.
        </p>
        <p>
          So before you sit down to invent the next thing, ask a harder question. Did the last thing actually reach
          everyone it should have, in every format it could have. Usually the answer is no, and the fastest growth you
          have available is hiding in the videos you already made and quietly abandoned. The next idea is not your
          bottleneck. The reach of the ideas you already have is.
        </p>
      </Article>
    </>
  );
}
