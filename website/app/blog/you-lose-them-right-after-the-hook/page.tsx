import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-lose-them-right-after-the-hook")!;

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
          You did the thing everyone tells you to do. You wrote a hook. The first line is good, maybe the best line in
          the whole video, the one you were sure would stop the scroll. And it worked. People landed on it. Then they
          left anyway, a few seconds later, before you ever reached the part you actually cared about. So you go back and
          rewrite those first three seconds one more time, because that is the part everyone swears matters most.
        </p>
        <p>
          The hook was not the problem. You won the open and then lost the ten seconds right behind it, in the stretch
          nobody warns you about, the little runway between your good first line and the thing that line promised. That
          gap is where most of your audience quietly gets off.
        </p>

        <h2>Winning the first second is not winning the video</h2>
        <p>
          The advice you have absorbed is that the first three seconds decide everything, so that is where the effort
          goes. Plenty of people do leave in those three seconds. But more leave in the twenty seconds after, once you
          have already earned the look. Over a third of viewers{" "}
          <a
            href="https://narrationbox.com/blog/why-viewers-drop-off-after-30-seconds-youtube"
            target="_blank"
            rel="noopener noreferrer"
          >
            drop off inside the first thirty seconds when the intro drags
          </a>
          , and for the casual viewer scrolling for anything to watch, a slow open pushes that closer to 60 percent.
          Those are not people who hated your hook. They liked it enough to give you a beat. They left in the space
          between the hook and the payoff.
        </p>
        <p>
          Open your own retention graph and you can usually see it. There is the expected drop at the very start, and
          then a second slide right after it, a steady bleed through your setup while you are still getting going. The
          hook did its job. The next ten seconds undid it.
        </p>

        <h2>The setup is where you break the promise</h2>
        <p>
          A hook makes a promise. It says, here is something worth your next minute. The second someone stays, they are
          waiting for you to start paying that off. And most of us do the exact opposite. We back up. Hey guys, welcome
          back, and then a slow bit of context before the real thing starts. Editors have a name for what this costs. A
          branded cold open or a hey-guys preamble{" "}
          <a href="https://vidiq.com/blog/post/increase-audience-retention-youtube/" target="_blank" rel="noopener noreferrer">
            burns the very seconds a viewer is using to decide whether to stay
          </a>
          . You promised now and delivered later, and later turns out to be a place a lot of people will not follow you
          to.
        </p>
        <p>
          It always feels necessary while you are making it. You are sure they need the context or the payoff will not
          land. Usually they do not need it, not yet. What they need is a reason to want the context, and the payoff is
          that reason. Give people the interesting thing first and they will happily sit through the setup afterward,
          because now the setup answers a question they already have instead of delaying one you keep dangling.
        </p>

        <h2>Some setup earns its place</h2>
        <p>
          None of this means you can never explain anything. Some videos genuinely need a line of context or the payoff
          means nothing. The test is order, not deletion. If a piece of setup makes the payoff land harder, it can stay,
          but it goes after you have given people a reason to care, not before. The failure is almost never that you
          explained too much. It is that you explained it first, to people who had not yet decided they wanted the
          explanation.
        </p>

        <h2>Start in the middle</h2>
        <p>
          The fix is cheaper than another rewrite. Find the first line in your video where the real thing actually
          starts, the sentence you would lead with if a friend asked what the video is about, and move it up so it lands
          right behind the hook. Cut the greeting and the this-is-what-today-is-about. Start mid-moment, the way you talk
          when you cannot wait to tell someone something. You would not open with, hey, welcome to my kitchen, today we
          are making pancakes. You would open with the pan already smoking.
        </p>
        <p>
          Then keep doing it past the intro. Retention keeps sliding when people are made to wait too long between
          payoffs, so the move is to{" "}
          <a href="https://georgeblackman.substack.com/p/5-retention-killing-youtube-mistakes" target="_blank" rel="noopener noreferrer">
            scatter small wins all the way through
          </a>{" "}
          instead of saving everything for the end. A line, a small payoff, the next small promise, the next payoff. The
          viewer never hits a flat stretch where nothing is arriving and the scroll starts to look better than staying.
        </p>
        <p>
          The edit is where the runway hides. Watch your own video back and mark the exact second it finally gets good.
          There is almost always dead space in front of that second, ten or fifteen seconds you would never miss if they
          vanished. That dead space is not your hook. It is the thing wedged between your hook and the reason your hook
          worked.
        </p>
        <p>
          So before you touch that first line again, try something that costs nothing. Play the video and notice the
          exact moment you, the person who made it, start to get a little bored. It is almost never the hook. It is a few
          seconds later, in the part you added to be helpful. Cut straight to the good thing, and the hook you already
          wrote will finally get to keep the promise it made. You were never bad at getting attention. You just kept
          spending it before anyone had a reason to stay.
        </p>
      </Article>
    </>
  );
}
