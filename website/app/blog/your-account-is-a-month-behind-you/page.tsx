import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("your-account-is-a-month-behind-you")!;

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
          You gave up a Sunday and filmed the whole month. Ten clips, back to back, same shirt, same corner, then you
          loaded them into a scheduler and set them to go out one a day. It felt like the day you finally got organized.
          No more scrambling at eleven at night, no more guilty gaps. The thing that was quietly killing you, having to
          show up every single day, was suddenly handled a month at a time.
        </p>
        <p>
          Then something else went wrong, and it took a while to notice. On Monday your video went out and a few people
          said the same thing underneath it, a small correction, or a question you had not thought to
          answer. That is exactly the kind of thing that should shape what you make next. Except the next eight were
          already shot, sitting in the queue, and there was nothing to do with what you just learned until every one of
          them had played out. Your account was a month behind you.
        </p>

        <h2>The part of the advice nobody prices in</h2>
        <p>
          Batching is the most repeated survival tip in content, and it is not wrong. Search how to stay consistent and
          every answer is a version of the same move: block one day, film a stack, schedule it out. People will promise
          you a{" "}
          <a
            href="https://www.socialync.io/blog/batch-content-creation-guide-2026"
            target="_blank"
            rel="noopener noreferrer"
          >
            month of content in a single afternoon
          </a>
          . It really does fix the consistency problem, and consistency matters, so most people take the deal without
          reading the small print.
        </p>
        <p>
          Here is the small print. When you make a month at once, you make all of it before you have learned a single
          thing from any of it. Every post is a small test of what your people actually want, and batching runs thirty
          tests with the answers sealed in an envelope you are not allowed to open until they are all over. The video
          that would have taught you to cut the slow intro goes out on day three. The lesson lands on day four. Days five
          through thirty were shot on day zero, by a version of you who did not know yet.
        </p>

        <h2>Making things is how you get better at making things</h2>
        <p>
          This matters more than it looks, because getting better at anything runs on a loop. You do the thing, you see
          what happened, you change one part, you do it again. Tighten the time between those steps and you improve
          faster. Stretch it out and you crawl. It is why{" "}
          <a
            href="https://www.jrothman.com/mpd/2018/07/shorter-feedback-loops-help-us-learn-faster/"
            target="_blank"
            rel="noopener noreferrer"
          >
            shorter feedback loops help people learn faster
          </a>
          , and why piling up hours with no signal on how you did, or a signal that arrives too late to use, mostly
          trains you to repeat yourself instead of getting sharper.
        </p>
        <p>
          Now count the loops. If you post, pay attention, and let the next video absorb what you saw, you get something
          like fifty rounds of learning in a year. If you batch a month at a time, you get twelve. Same number of
          videos, a quarter of the learning. The creators who seem to level up fast are usually not more gifted than you.
          They kept the gap between posting one thing and making the next one short, so each video got to teach the one
          after it.
        </p>
        <p>
          None of this means you have to react to everything, or that a plan is bad. Some of what you make should ignore
          the day entirely, and chasing every comment is its own trap. The problem is not planning ahead. It is planning
          so far ahead that the answers can no longer reach the work.
        </p>

        <h2>The tell is a queue you cannot steer</h2>
        <p>
          You can feel this happening if you watch for it. It is the low dread of seeing your own scheduled post go out
          on a Thursday already knowing it is a little off, and having no way to reach in. It is opening the app to a
          comment thread that would have made a great video, on a day when your next four are locked. It is catching a
          moment on Tuesday and having nowhere to put it, because the calendar is full of choices a person you barely
          remember being made three weeks ago.
        </p>
        <p>
          A full queue looks like being ahead of the game. A lot of the time it is just being unreachable. The account
          keeps posting on schedule while the actual you, the one who has watched the last ten land and finally knows
          something, stands outside it with no door in.
        </p>

        <h2>Batch the part that does not talk back</h2>
        <p>
          The fix is not to throw out batching and go back to scrambling at midnight. That trades one real problem for
          another. The fix is to notice that a video has two layers, and only one of them needs to hear from anyone.
        </p>
        <p>
          One layer is setup. The lighting, the framing, the same shirt, the shape of your intro, the b-roll, all the
          parts that are identical across ten videos and get nothing out of waiting. Batch that as hard as you like.
          Shoot a pile of it, get it out of the way, protect your Sunday.
        </p>
        <p>
          The other layer is the part that should be listening, which is what you actually say, the first line, the
          topic you pick this week. Keep that one close to real time. Shorten the queue so it holds a week instead of a
          month, and leave a slot or two open on purpose, so when a comment or a moment shows up you have somewhere to
          put it while it is still warm. Before you shoot the next batch, watch the last thing that went out and let it
          change one decision. That one habit is the whole loop, put back.
        </p>
        <p>
          The reason to post was never only to keep the calendar full. It was to find something out, week after week,
          and slowly turn into the person who can make the video you cannot make yet. A queue stacked a month deep
          quietly stops telling you anything, and a decent run of numbers can hide that for a while. The empty slot you
          keep rushing to fill in advance was never the gap to worry about. It is the one place next week&apos;s better
          video was ever going to come from.
        </p>
      </Article>
    </>
  );
}
