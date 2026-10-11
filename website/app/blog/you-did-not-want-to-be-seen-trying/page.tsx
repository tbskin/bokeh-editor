import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-did-not-want-to-be-seen-trying")!;

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
          There is a video you have been meaning to make for about a year. You have the idea. You have had it for a
          while. You own a phone that shoots fine and you can find a spare hour if you want one. Every few weeks you
          think, I should really start doing this, and then you do not, and you cannot fully explain it to yourself,
          because none of the usual reasons quite fit.
        </p>
        <p>
          Sit with it and the honest answer is not time or ideas or the camera. It is that making the thing means being
          seen trying to make it. Not seen failing, exactly. Seen wanting something, and reaching for it in public,
          before you are any good. That is the part that keeps the idea sitting where it is, and it is the one reason
          people almost never say out loud.
        </p>

        <h2>Being caught caring</h2>
        <p>
          Somewhere along the way most of us learned that the cool thing is to look like you are not trying. The good
          stuff is supposed to come easy. The people we admire seem to make it without visible effort and without
          obviously wanting it. Posting is the exact opposite of that pose. It is you, on the record, plainly reaching
          for something you have not earned yet, doing it worse than the people you look up to, where anyone who knows
          you can watch.
        </p>
        <p>
          The dread is oddly specific. It is your coworker catching it in their feed and thinking, oh, she is doing that
          now. It is the friend who sees it and says nothing, which somehow says more than a bad comment would. Failing
          quietly costs you nothing you can feel. Being caught wanting it and coming up a little short feels like handing
          people a reason to think less of you, and worse, a reason you went out and volunteered. So the safest move
          becomes the one that leaves no trace, and not posting is the only version of this that never has to be seen by
          anyone.
        </p>

        <h2>The crowd in your head is meaner than the real one</h2>
        <p>
          The audience you are flinching from lives mostly in your head, and it is harsher than the real one on the
          other side of the screen. Two things about actual people are worth knowing here. The first is that we walk
          around badly underestimating how much other people like us. In the work that named the{" "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/30183512/" target="_blank" rel="noopener noreferrer">
            liking gap
          </a>
          , people leaving a conversation guessed the other person liked them less than that person actually did, over
          and over, in quick first chats and across months of sharing a dorm. We grade our own performance harshly and
          then assume everyone else graded it the same way. They did not.
        </p>
        <p>
          The second one should change how the fear feels. People admire effort. Not the results of effort, the effort
          itself. Across{" "}
          <a
            href="https://bpb-us-e2.wpmucdn.com/sites.uci.edu/dist/1/863/files/2025/01/Celniker-et-al-2022a.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            eight studies of more than five thousand people
          </a>
          , someone who visibly worked harder was judged as more moral and more deserving of reward, even when the extra
          effort produced nothing better. The exact thing you are hiding, that you care about this and are working at it,
          sits closer to what people quietly respect than to what they mock.
        </p>
        <p>
          Be honest about the exception. A few people will find it cringe. Earnestness does embarrass some watchers, and
          you will feel those ones the loudest. But they are a small and noisy slice of a crowd that mostly is not
          thinking about you at all, and they are the exact people you were never going to build anything with or for.
          Arranging your whole life around not getting a smirk from someone who was never on your side is a bad trade.
          It is also the trade most people make without noticing they made it.
        </p>

        <h2>The pose that feels safe</h2>
        <p>
          There is a way to post that looks like it dodges all of this, and it is worth naming because so many people
          land on it. You put the video out, but you get ahead of it first. It is just for fun. I am only{" "}
          <Link href="/blog/you-gave-it-a-trial-period">experimenting</Link>. I do not really care if it does anything.
          You reach for the thing while announcing that you are not really reaching, so a flop cannot land on you. You
          never wanted it, so you cannot have lost it.
        </p>
        <p>
          It fails on both ends. To the people watching, hedging a bid for attention with studied I-do-not-care reads as
          less sincere, not more modest. When researchers looked closely at this move, the version{" "}
          <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2597626" target="_blank" rel="noopener noreferrer">
            dressed up in humility
          </a>{" "}
          landed worse than just plainly wanting the thing. And to you, the pose keeps the work small, because the
          escape hatch stays open and you never actually commit to caring, which happens to be the only state in which a
          person makes anything good. The detachment guards your ego and starves the work in the same motion.
        </p>

        <h2>The ease you are trying to skip to</h2>
        <p>
          The people who look effortless, the ones whose offhand little video you envy, did not skip this. They paid it
          already. There is footage of nearly all of them being stiff and eager and slightly embarrassing, from back
          when no one was watching and it cost nothing to be bad. The ease you see now is not a thing they were born
          with and you were not. It is what is left over after a person stops hiding the effort. They went through the
          cringe to get to it.
        </p>
        <p>
          So the goal was never to get good enough that the trying stops showing. Trying always shows. The ones who make
          it are simply the ones who let it. The version of you that posts is not braver than you or more gifted than
          you. It is the one who decided that being seen wanting this was a price worth paying, and paid it today, while
          it was still cheap.
        </p>
      </Article>
    </>
  );
}
