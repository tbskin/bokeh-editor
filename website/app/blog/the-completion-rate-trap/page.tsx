import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { WatchTimeBars } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("the-completion-rate-trap")!;

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
          The clip is 41 seconds long and you are about to make it 18. You grab the end of it in the timeline and drag
          left, and the timer drops, 0:41, 0:36, 0:29, and you keep going, because a video people finish is supposed to
          beat a video people quit. The part you are deleting is the bit in the middle where you slowed down and actually
          explained the thing. You export it fast and tight, half of what you meant now in the trash, and it feels like
          the right call.
        </p>
        <p>
          You did what everyone tells you to do: keep it short, hook fast, get out before anyone leaves. But look at what
          you were chasing when your thumb was on that clip. Not a better video, just a higher completion rate, the share
          of people who make it to your last frame. Somewhere along the way that number became the score you play for, and
          it is the wrong one. The mix-up quietly shapes everything you make.
        </p>

        <h2>The number that feels like the score is not the score</h2>
        <p>
          Think about the numbers you actually check after you post: likes, saves, completion rate, follower count. They
          feel like a grade, and a grade is nice to look at, so you keep looking. None of them are what the app uses to
          decide whether to show your video to the next thousand people.
        </p>
        <p>
          The app makes money one way: it keeps people watching and sells that time to advertisers. So the thing it
          counts, the thing it rewards you for, is time. Not whether someone tapped a heart or reached your last frame,
          just how many seconds they stayed. That sounds like a small distinction, but it is the whole game. It is the gap
          between the score you keep checking and the score the app is actually keeping.
        </p>

        <h2>The app is telling you this out loud</h2>
        <p>
          You do not have to guess at any of this. The people who run these apps say it plainly. In January 2025 the head
          of Instagram, Adam Mosseri, told creators that what decides how far a reel travels is watch time, likes, and
          sends, and that the one to really keep an eye on is your{" "}
          <a
            href="https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/"
            target="_blank"
            rel="noopener noreferrer"
          >
            average watch time
          </a>
          . That is the seconds people actually spend watching, not the percentage who make it to the end.
        </p>
        <p>
          TikTok puts it the same way. When it explains how the For You feed picks what to show, it points to one
          especially strong sign of interest,{" "}
          <a
            href="https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you"
            target="_blank"
            rel="noopener noreferrer"
          >
            whether someone watches a longer video all the way through
          </a>
          . They reward a long video that holds you, not a short one that simply ends.
        </p>
        <p>
          Now do the math on your own edit. Your 18 second video, watched to the end by everyone, gives the app 18
          seconds. The 41 second one you were too scared to keep, watched by the same people to about 60 percent before
          they wander off, gives it around 25. The longer video loses on completion rate and wins on time. You cut it to
          make the percentage look better, and you threw away a third of the watching.
        </p>
        <WatchTimeBars />

        <h2>Length was never the problem</h2>
        <p>
          Once you are counting time, being scared of long videos starts to look silly, and the apps agree with you. They
          make more money the longer you stay, so they keep making room for longer videos. TikTok started out capping you
          at fifteen seconds. Now it lets you post{" "}
          <a
            href="https://techcrunch.com/2022/02/28/tiktok-expands-max-video-length-to-10-minutes-up-from-3-minutes/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ten minute videos
          </a>
          , up from three, and it made that change on purpose, to keep people watching in the app instead of leaving to
          find a part two somewhere else.
        </p>
        <p>
          The enemy was never length, it is boredom. A boring 41 seconds loses because people leave, and it should. But
          41 seconds that keep you watching beat 15 that were over before they got going. Winning the{" "}
          <Link href="/blog/the-first-three-seconds">first three seconds</Link> is how you get someone to stay, and what
          you do after that is the part that gets counted. A short video that felt like a win because everyone finished it
          can still have lost, because holding someone for a moment is not the same as holding them for a while.
        </p>

        <h2>Count the thing that actually pays</h2>
        <p>
          Everyone chases completion rate anyway, because it is easy. It is a clean percentage, it jumps the second you
          cut, and watching it climb feels like getting better. Time is messier and less flattering, and it is the number
          the app actually acts on. When the two disagree the app wins, every time, because it decides who sees you next.
        </p>
        <p>
          So change the question you ask. Instead of whether a post did well, judged by taps and a neat percentage, ask
          how much time it actually collected. Once that is the question, the rest gets simpler. You stop cutting good
          moments just to hit a runtime, you let a bit breathe when it is working, and you quit treating a viral fifteen
          seconds as a trophy when it barely added up to anything.
        </p>
        <p>
          The next time your thumb is on the end of the clip, dragging it inward, do not ask how short you can make this.
          Ask whether the seconds you are about to cut were losing people or keeping them. If they were losing people, cut
          them without mercy, because that was dead weight. If they were keeping people, leave them in. That footage is
          the exact thing the app was about to pay you for.
        </p>
      </Article>
    </>
  );
}
