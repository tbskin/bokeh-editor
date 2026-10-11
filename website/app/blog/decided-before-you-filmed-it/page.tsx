import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("decided-before-you-filmed-it")!;

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
          You spend an evening on a video. You trim the dead air, fix the audio, get the cuts to land on the beat, redo
          the opening twice because it felt slow. You post it. It does almost nothing. So you take the lesson that feels
          obvious. You need to get better at editing. Next time you spend two evenings on it, and it does almost nothing
          again.
        </p>
        <p>
          The editing was probably fine. Most of what decided that video happened before you ever hit record, in the
          minute you spent picking the idea. That minute is the part almost nobody works on, because it does not feel
          like work.
        </p>

        <h2>The idea decides how far a video can go</h2>
        <p>
          Every finished video has a ceiling, and the ceiling is set by the idea, not the cut. The editing decides how
          much of that ceiling you actually reach. It cannot raise it. A dull idea shot beautifully and cut to the frame
          is a dull video with good lighting. An idea people genuinely want, filmed on your phone with a rough cut, still
          pulls them in, because the thing they came for was the idea and not your color grade.
        </p>
        <p>
          Paddy Galloway, who advises some of the largest channels on the platform, says the idea is what decides whether
          a video tops out at{" "}
          <a
            href="https://www.colinandsamir.com/resources/the-new-rules-of-youtube-from-paddy-galloway"
            target="_blank"
            rel="noopener noreferrer"
          >
            50,000 views or 5 million
          </a>
          , before anyone films a frame. The person and the camera did not change. The idea did. And yet almost all of a
          creator&apos;s hours go into the filming and the edit, the visible parts, while the idea that set the ceiling
          got a few seconds of thought on the way out the door.
        </p>
        <p>
          This is not the same as saying effort does not matter. A great idea filmed and cut carelessly can still fall
          apart. The point is about direction. Good editing protects an idea and gets it closer to its ceiling. It cannot
          invent a ceiling the idea never had. So when a video underperforms, the edit is the last place to look, not the
          first.
        </p>

        <h2>The people who look effortless pick the idea first</h2>
        <p>
          Watch how the most deliberate creators actually work and the order is flipped from how most of us do it. A
          former strategist at MrBeast&apos;s company said he filtered through{" "}
          <a
            href="https://www.cnbc.com/2026/05/10/youtube-advisors-mrbeast-top-creators-platform-viewership.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            roughly 10,000 ideas
          </a>
          , hunting for concepts that could grow the audience. When the channel wanted to reach more women, the fix was
          not a filming trick. It was an idea, a video about surviving thirty days stranded with an ex, and it has since
          passed 120 million views. The work that produced that number was done before anyone booked a location.
        </p>
        <p>
          There is now a whole class of advisors who charge $15,000 a month and up, mostly to help creators choose and
          frame ideas rather than to touch the footage. One of them moved a creator off daily vlogs and toward bigger
          concepts, and the views followed. That is a strange thing to pay for if the edit were the hard part.
        </p>
        <p>
          You can see the same instinct in the way MrBeast&apos;s team treats a leaked internal playbook that puts
          enormous weight on nailing the{" "}
          <a
            href="https://sherwood.news/culture/mrbeast-youtube-leaked-internal-success-document/"
            target="_blank"
            rel="noopener noreferrer"
          >
            title and thumbnail before production
          </a>
          . In short video the packaging is different, the first line and the first frame, but it is the same move.
          Decide the promise the video makes before you make it.
        </p>

        <h2>You can run the cheap version of that test</h2>
        <p>
          You do not have a team or 10,000 ideas to sort. You have one sentence. Before you make anything, say the idea
          out loud the way you would say it to a friend, in one line, with no setup. Then ask whether a stranger scrolling
          past would stop if that sentence were the first thing they heard.
        </p>
        <p>
          That is the whole test, and it is harsh because it takes away everything you were quietly counting on to rescue
          the video. There is no cut to hide behind and no music to carry a flat moment. It is just the idea, said
          plainly, doing all the work on its own. If the sentence is boring to say, the video will be boring to watch, and
          three nights in the edit will not move it.
        </p>
        <p>
          It helps to hear it fail. &quot;A day in my life as a nurse&quot; is a topic, not a reason to stop. &quot;The
          thing nobody tells you before your first shift as a nurse&quot; is closer, because now the sentence opens a gap
          you want closed. Neither one is a script and neither one is polished. The whole difference is in the idea, which
          is exactly the level you want to be fighting on before you spend the night.
        </p>
        <p>
          Most of the ideas you have will not pass, and that is the point of doing it. The test is cheap so you can fail
          it cheap, a few seconds of honesty instead of an evening you do not get back.
        </p>

        <h2>This is easier than getting faster at editing</h2>
        <p>
          There is something freeing in this once it lands. The flop you took to heart was probably not a verdict on your
          editing or your talent. You made a perfectly good version of an idea that never had much of a ceiling. That is a
          different problem, and a smaller one, and it is fixable at the only step where fixing it is cheap.
        </p>
        <p>
          It also means the most useful skill you can build is not editing faster or hooking harder. It is telling, before
          you start, which ideas are worth an evening and which ones to let go. That skill is quiet and it never shows up
          in a tutorial, because there is nothing to watch someone do. They just sit with it a little longer before they
          commit, and they throw far more away than they keep.
        </p>
        <p>
          So the next time a video lands flat, try not to open the editor and grind harder. Go back one step, to the
          sentence you started from, and ask if you would have stopped for it. Fix that, and most of the editing you were
          about to redo stops mattering.
        </p>
      </Article>
    </>
  );
}
