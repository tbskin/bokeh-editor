import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-aimed-at-the-number")!;

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
          You add a line to the top of a video you did not really mean. Wait for the part at the end. You know the end
          does not pay that line off, not the way it promises, but the line lifts the first couple of seconds, and the
          first couple of seconds are the thing everyone tells you to protect. So you leave it in. The video does a
          little better than usual. You do it again on the next one.
        </p>
        <p>
          Do that enough times and something quietly changes about how you work. You are no longer making a video and
          then seeing how it did. You are making the number go up, and the video is the wrapper you build around it. That
          switch feels like finally taking growth seriously. It is usually the moment the work starts getting worse.
        </p>

        <h2>When a measure becomes a target</h2>
        <p>
          There is an old idea about this that has nothing to do with video. An economist named Charles Goodhart noticed
          it in the 1970s watching governments try to steer the economy, and an anthropologist, Marilyn Strathern, later
          put it in one plain sentence:{" "}
          <a href="https://en.wikipedia.org/wiki/Goodhart%27s_law" target="_blank" rel="noopener noreferrer">
            when a measure becomes a target, it ceases to be a good measure
          </a>
          . The moment you start steering by a number, people find the ways to move the number that skip the thing it was
          supposed to stand for, and the number stops telling you anything true.
        </p>
        <p>
          Views were always a stand-in. A rough guess at a realer question, which is whether anyone actually wanted this.
          Watch time is a stand-in too, a guess at whether the video held someone. As long as you aim at the real
          question and make something people want, the numbers tag along behind you. The trouble starts when you cut out
          the middle and aim straight at the number, because there is always a cheaper way to move a number than to earn
          it.
        </p>

        <h2>The shortcuts are always right there</h2>
        <p>
          You know the moves because you have scrolled past all of them. The title that promises more than the video has.
          The thumbnail pointing at a moment that never happens. The question glued to the end, what do you think, comment
          below, that exists only to poke the comment count. The cut that fakes a cliffhanger the story did not actually
          have. Each one works. Each one nudges the exact number you were watching, that same afternoon.
        </p>
        <p>
          And each one quietly spends something the dashboard never shows you. When a stranger taps your video, they are
          making a small bet that the person behind the name will not waste the next thirty seconds. The fake hook wins
          the tap and loses the bet, and people remember losing the bet a lot longer than they remember the tap. You
          bought a better number today with a little of the reason anyone would trust the next one. On the screen it looks
          like progress. On the other side it feels like being tricked, and being tricked is the thing people quietly
          leave over.
        </p>
        <p>
          It is worth being fair to the honest version of these moves, because the line is thin and it matters. A real
          hook says the most interesting true thing first and then delivers it. A good title tells you exactly what you
          are about to get. There is nothing wrong with wanting to win the open, and a video that buries its best moment
          deserves to lose it. The tell is not whether you tried to catch someone. It is whether the video keeps the
          promise the top of it made. Aiming at the number erases that line, because the number does not care whether you
          kept the promise, only whether they tapped.
        </p>

        <h2>The platforms have already fought this</h2>
        <p>
          This is not a guess about human nature. The platforms watched it happen and had to react. Back in 2012, YouTube
          ranked videos mostly by views, so creators wrote clickbait titles to rack up views on videos that did not
          deliver, and enough people complained that YouTube{" "}
          <a
            href="https://techcrunch.com/2012/10/12/youtube-changes-its-search-ranking-algorithm-to-focus-on-engagement-not-just-clicks"
            target="_blank"
            rel="noopener noreferrer"
          >
            tore up the system and started ranking by watch time instead
          </a>
          . In December 2017, Facebook{" "}
          <a
            href="https://about.fb.com/news/2017/12/news-feed-fyi-fighting-engagement-bait-on-facebook/"
            target="_blank"
            rel="noopener noreferrer"
          >
            began demoting posts that begged for interaction
          </a>
          , the like this if you agree kind, because people had told them plainly they hated being goaded.
        </p>
        <p>
          Notice what actually happened there. A number got popular, people aimed at it, they gamed it until it stopped
          measuring anything worth measuring, and the platform moved the target out from under them. That is the pattern
          every time. So even if you only care about the cold mechanics of reach, aiming at whatever the current number
          is means aiming at a spot that is going to move, and the people who crowded there first are the ones it moves
          away from.
        </p>

        <h2>The number is fine once you stop aiming at it</h2>
        <p>
          None of this means numbers are the enemy, or that you should post into the dark and never look. That is the
          same mistake flipped over. A number is genuinely useful. It is information about what already happened, a note
          from the people who watched telling you what landed and what did not.
        </p>
        <p>
          The whole difference is which way you point it. Looking backward, a number is honest. It tells you a video held
          people or lost them, and you can go find out why and make a better one. Pointed forward, as the thing the next
          video is built to satisfy, it becomes that fake hook and that begging caption, and it slowly trains you to want
          the wrong thing, until you cannot tell a video you are proud of from a video that did a good number, because you
          taught yourself they are the same.
        </p>
        <p>
          So look at the number after, not before. Read it as what it is, a rough report on real people, and then close
          the tab and go make the next thing for one of them instead of for the count. The odd part is that the numbers
          you stop chasing tend to come out ahead anyway, because you finally went back to making the thing they were only
          ever trying to measure.
        </p>
      </Article>
    </>
  );
}
