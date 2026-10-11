import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { RetentionCurve } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("the-first-three-seconds")!;

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
          You spent a whole evening on a video. Good idea, clean footage, a point you actually cared about. It got two
          hundred views and you cannot figure out why. Here is the uncomfortable part. Most of the people who scrolled to
          it never reached the point you worked so hard on. They were gone before you finished your first sentence.
        </p>
        <p>
          Short video does not fail in the middle. It fails at the very front. The idea can be great and the ending can
          land and none of it matters if the opening does not earn the next three seconds. That is the whole game now,
          and almost nobody plans for it. People polish the part of the video that most of their audience will never see.
        </p>

        <h2>The window is smaller than you think</h2>
        <p>
          Put a number on it and it stings. Roughly{" "}
          <a href="https://autofaceless.ai/blog/attention-span-statistics-2026" target="_blank" rel="noopener noreferrer">
            71 percent of viewers decide to scroll past within the first three seconds
          </a>
          . Average screen attention has slid to about 47 seconds per task, and on a fast feed you are working with far
          less than that. You are not competing for a full watch. You are competing for permission to keep going, granted
          in the time it takes to read this sentence.
        </p>
        <p>
          The drop is not spread evenly across the video either. It is front loaded. The steepest cliff is in those first
          few seconds, and whatever survives that cliff tends to stick around much longer. Win the open and the rest of
          the curve is gentle. Lose it and there is no rest of the curve, because there is no one left on it.
        </p>
        <RetentionCurve />
        <p>
          This is why raising your average watch time almost always starts at the beginning, not the end. A better last
          ten seconds helps the few who made it. A better first three seconds changes how many people become the few.
        </p>

        <h2>A hook is a promise, not a gimmick</h2>
        <p>
          The word hook has been ruined by people who think it means a loud noise or a fake shock. That is not it. A hook
          is a promise. In the first moment it tells the viewer what they are about to get and why staying is worth it.
          Clickbait makes a promise the video does not keep, which is why it burns trust and tanks retention a few
          seconds later. A real hook makes a promise the video actually delivers.
        </p>
        <p>
          So the opening is not decoration you bolt on at the end. It is a contract. It says here is the specific thing
          this video is about, and here is the reason it is for you. When the open is vague, the viewer cannot tell what
          they are being offered, so they default to the safest choice available, which is to keep scrolling. Ambiguity
          reads as not for me.
        </p>

        <h2>What actually works in three seconds</h2>
        <p>Most strong openings do a few unglamorous things well.</p>
        <p>
          Start in motion. Open in the middle of the action or the middle of a sentence, not with a slow logo, a throat
          clear, or hey guys welcome back. The first frame should already be doing work. If the first second could be
          deleted without losing anything, delete it, because the feed already did.
        </p>
        <p>
          Front load the payoff. Whatever is most interesting, most useful, or most surprising about the video, move it
          as close to the start as you can. The instinct to build up to it is a habit from formats where the audience
          already agreed to watch. On a feed, nobody agreed to anything yet. Show the result, then explain how you got
          there.
        </p>
        <p>
          Make the first frame legible on mute, at a glance. Many people meet your video with the sound off and their
          thumb already moving. The opening image and the words on screen have to carry the promise on their own, before
          a single word is heard.
        </p>

        <h2>The mistake is treating the hook as the whole job</h2>
        <p>
          Here is where people overcorrect. They obsess over the first three seconds, nail the open, and let the body of
          the video sag. The platforms measure the entire curve, not just the front. Videos that hold{" "}
          <a href="https://autofaceless.ai/blog/attention-span-statistics-2026" target="_blank" rel="noopener noreferrer">
            70 to 85 percent of viewers through that opening window pull about 2.2 times the total views
          </a>{" "}
          of videos that do not, and shorts that stay above 75 percent retention are far more likely to get pushed to new
          people. The hook buys you attention. The rest of the video has to be worth the attention it bought.
        </p>
        <p>
          The clean way to think about it. The hook decides how many people start. Retention decides how far the platform
          spreads it. You need both, and they are different skills. A great open on a boring video just means more people
          witnessed the boring part before they left.
        </p>
        <p>
          So stop thinking of it as a thirty second video with a hook stapled to the front. You are making a three second
          promise and then keeping it for as long as you asked people to stay. Get the promise right, keep it honestly,
          and the numbers you have been staring at start to move.
        </p>
      </Article>
    </>
  );
}
