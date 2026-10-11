import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { BottleneckPipeline } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("the-editing-tax")!;

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
          Ask someone why they stopped posting and they will usually blame ideas. I ran out of things to say. Watch what
          actually happened and it is almost never the ideas. It is the folder. The one on their phone with forty clips
          they never turned into anything, because turning clips into a post is the part that quietly costs a whole
          evening.
        </p>
        <p>
          Filming is cheap. You can shoot a good clip in a minute between meetings. The tax comes after: trimming the
          dead air, picking which takes to keep, putting them in an order that makes sense, matching the cuts to what you
          said, writing captions, exporting, watching it back, and redoing the half that felt off. That is the work
          nobody warns you about, and it is where most content strategies quietly die.
        </p>

        <h2>Do the math once and it gets uncomfortable</h2>
        <p>
          Put a number on it. If your time is worth 50 to 100 dollars an hour, and one video takes four hours to edit,
          that single post{" "}
          <a href="https://becreatives.co/editing-clips/" target="_blank" rel="noopener noreferrer">
            cost you 200 to 400 dollars
          </a>{" "}
          of time you could have spent on the actual business, or on making three more things. The bottleneck is not
          that the work is hard. It is that it never clears. Every new recording adds to a pile that only you can
          process, and the pile grows faster than you can cut it.
        </p>
        <p>
          Now stack the frequency advice on top. Every platform rewards showing up often, and the common target is{" "}
          <a href="https://www.opus.pro/blog/short-form-video-strategy-2026" target="_blank" rel="noopener noreferrer">
            three to five posts a week
          </a>
          . Run the arithmetic. Three posts a week at an evening of editing each is most of your free time, gone,
          forever, with no week off. For one person that is not a strategy. It is a countdown to burning out or dropping
          off, and almost everyone drops off.
        </p>

        <h2>Your pipeline is only as fast as its slowest step</h2>
        <p>
          Here is the reframe that changes how you plan. A content pipeline behaves like any other pipeline. Its output
          is capped by its slowest step, not its fastest. You can have brilliant ideas and shoot beautiful footage, and
          if the edit is the constraint, none of that raises your output by a single post. The ideas just wait in line
          behind the edit.
        </p>
        <BottleneckPipeline />
        <p>
          Most people optimize the wrong step. They read about hooks, buy a better mic, brainstorm more angles. All of
          that improves steps that were not the bottleneck. The pipeline still moves at the speed of the edit, because
          that is the constraint, and improving a step that is not the constraint does nothing. It feels productive and
          changes your output not at all.
        </p>
        <p>
          So the first move in any content strategy is boring. Find your slowest step. For almost everyone making video,
          it is the edit. Then go after that step specifically, before touching anything else.
        </p>

        <h2>What actually relieves the edit</h2>
        <p>A few things move the constraint, in rough order of leverage.</p>
        <p>
          Batch the capture so you are not context switching. Filming eight clips in one sitting and posting them over
          weeks is far cheaper per post than filming one at a time.
        </p>
        <p>
          Repurpose instead of always producing. One long recording can become many short clips, which means the
          expensive part, showing up and saying something real, happens once and pays off many times.
        </p>
        <p>
          Cut the per edit time itself. This is the big one, because it multiplies across every post you will ever make.
          Most of those four hours is mechanical work: trimming, syncing, captioning, formatting. That is labor, not
          authorship, and it is exactly the kind of work you can hand off or automate without touching what makes the
          video yours.
        </p>

        <h2>Keep the part that is actually you</h2>
        <p>
          One caution. When you go after the edit, be precise about which part you are cutting. There is a mechanical
          layer, the trimming and captioning and exporting, that you should ruthlessly minimize. There is a judgment
          layer, deciding what to keep and what the thing is even about, that is the actual creative work. Automate the
          first. Guard the second. The goal is not to remove yourself from your videos. It is to remove the busywork
          that was never you in the first place.
        </p>
        <p>
          If your content has stalled, do not start with new ideas. Start by finding the step where the work backs up.
          Fix that, and the ideas you already have finally have somewhere to go.
        </p>
      </Article>
    </>
  );
}
