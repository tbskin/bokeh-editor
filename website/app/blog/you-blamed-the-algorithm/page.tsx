import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-blamed-the-algorithm")!;

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
          A video does worse than you hoped, and within an hour you are somewhere you did not plan to be. A forum thread
          about shadowbans. A blog listing the eleven reasons your reach is down. You swap your hashtags, move
          tomorrow&apos;s post from seven to six, and turn a small flop into a whole evening of theories about what the
          app is doing to you.
        </p>
        <p>
          People talk about the algorithm the way they talk about weather they cannot control. Something up there
          decides, on grounds you can only guess at, whether your video gets seen. But there is no one up there making
          that call. The feed is not deciding whether to let your video in. It is counting what people did with it, and
          once you see that clearly, most of the theories fall apart.
        </p>

        <h2>There is no gatekeeper, only a tally</h2>
        <p>
          Here is what actually happens when you post. Your video goes out to a small handful of people first. What they
          do with it, whether they watch it to the end, whether they send it on, decides whether it reaches a bigger
          group, and that group decides the next one. It travels in waves, and each wave is a vote.
        </p>
        <p>
          TikTok is unusually plain about this. The company says its recommendations run on{" "}
          <a
            href="https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you"
            target="_blank"
            rel="noopener noreferrer"
          >
            user interactions
          </a>
          , the videos people watch and rewatch, the ones they share, the ones they skip in half a second. That is the
          whole engine. It has no taste. It is not sitting in judgment of your lighting or your idea. It forwards the
          things people do not scroll past and buries the things they do. When you picture the algorithm as a critic
          with feelings about you, you are handing a tally sheet a personality it does not have.
        </p>

        <h2>Which is why most hacks do nothing</h2>
        <p>
          Once you see the feed as a count of what people did, you get a simple test for every trick you read about. Does
          it change what a real person does? A sharper first line passes, because a human actually stops instead of
          scrolling. A cleaner payoff passes, because they stay to the end. Almost everything else on the hack lists does
          not touch that at all. Ten new hashtags do not make the person who sees your video watch longer. Posting at six
          instead of seven does not change whether they send it to a friend. You can spend a week tuning things that were
          never the thing.
        </p>
        <p>
          The tricks that try to fake the count are worse than useless. Engagement pods and bought likes manufacture a
          spike that the platforms are built to catch, and when they catch it they{" "}
          <a
            href="https://www.auditsocials.com/blog/tiktok-fake-artificial-engagement-policy-2026-bots-bought-followers-account-risk"
            target="_blank"
            rel="noopener noreferrer"
          >
            strip the fake activity
          </a>{" "}
          and leave you with an account that now reads as manipulated, with weaker real reach than before you started.
          You did not beat the count. You poisoned the one signal your videos depend on. So before you try any trick, ask
          one question first. Would this make a real person more likely to keep watching, or to send it on? If it would
          not, it is noise dressed up as strategy.
        </p>

        <h2>The shadowban is usually a story you prefer</h2>
        <p>
          The strongest version of blaming the machine is the shadowban. Reach drops across a few posts and the
          explanation arrives fully formed. The app has quietly throttled you. It is a comforting thought, because it
          means the work was fine and something invisible got in the way.
        </p>
        <p>
          Most of the time it is not what happened. Reach swings from post to post on its own, and a run of videos that
          did not land looks identical, from the inside, to being suppressed. People who are sure they were shadowbanned
          are usually{" "}
          <a href="https://socialk.it/en/blog/tiktok-shadowban-guide" target="_blank" rel="noopener noreferrer">
            looking at ordinary variance
          </a>{" "}
          or a few videos that just did not connect. TikTok has never officially used the word shadowban. What it says is
          narrower, that it limits how far it recommends content that breaks its rules or is not a fit for the feed. Real
          suppression exists, for real violations. But reaching for it the moment a video underperforms is not analysis.
          It is a way to avoid looking at the video.
        </p>

        <h2>The algorithm is a great excuse</h2>
        <p>
          This is the actual cost, and it has nothing to do with wasted hashtags. A flop hands you one useful thing: real
          people saw this and did not want more of it. That is not pleasant to hear, but it is the only thing that makes
          the next video better. The moment you decide the algorithm did it, you throw that away. You have turned a clear
          signal into a mystery, and you cannot learn from a mystery. You feel wronged, and you post the same kind of
          thing again.
        </p>
        <p>
          That is why the algorithm makes such a good villain. It lets every disappointing video mean nothing about your
          choices. The people who slowly get better are not the ones who cracked some code. They are the ones who let a
          flop mean the plain, slightly painful thing it usually means, and changed the next video because of it. Blaming
          the machine feels like defending your work. Mostly it defends you from feedback.
        </p>
        <p>
          So the next time a post dies and your hand drifts toward the shadowban thread, try treating the number as a
          message instead of a verdict handed down from somewhere above you. The feed is not a gate you have to talk your
          way through. It is a room full of people you already showed the thing to, and the view count is them telling
          you, honestly and a little bluntly, whether they wanted more. You do not have to outsmart that. You have to
          listen to it, which is harder, and worth more.
        </p>
      </Article>
    </>
  );
}
