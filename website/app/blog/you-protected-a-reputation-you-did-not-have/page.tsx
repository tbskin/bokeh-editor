import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-protected-a-reputation-you-did-not-have")!;

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
          You had a real opinion about your thing, the kind that would actually make someone stop and look, and somewhere
          between thinking it and posting it you talked yourself down to the safe version. You softened the claim into a
          maybe so no one could come at you. You had two ideas, a plain one and a stranger one you were more excited
          about, and you posted the plain one and told yourself it was the smart call. It did not feel like fear. It felt
          like being careful, like a professional who does not say something reckless with their name on it.
        </p>
        <p>
          Here is what you were being so careful about. You were protecting a reputation you do not have yet. That sounds
          harsh, but sit with it, because almost every cautious choice a small creator makes only makes sense for a
          creator who is not small.
        </p>

        <h2>A flop at your size is almost invisible</h2>
        <p>
          Play out what the bold post actually costs if it misses. The feed does not hand your video to a waiting crowd.
          It tests every new post on a small batch of people first and only pushes it wider if they stay, and it does
          this{" "}
          <a
            href="https://www.eclincher.com/articles/how-the-tiktok-algorithm-works-in-2026"
            target="_blank"
            rel="noopener noreferrer"
          >
            whether you have fifty followers or fifty thousand
          </a>
          , because reach on these apps is not tied to your follower count. So a swing that lands flat is not a public
          failure. A TikTok account with a few thousand followers averages{" "}
          <a href="https://admanage.ai/blog/average-tiktok-views" target="_blank" rel="noopener noreferrer">
            around 860 views a post
          </a>
          , which means a bad one gets half-watched by a few dozen people who forget it by the time they hit the next
          video, and by tomorrow the feed has stopped serving it and it sits buried under everything posted since.
        </p>
        <p>
          Nobody screenshots it, nobody remembers it. The disaster you brace for is a video that quietly did a normal
          number and vanished, which is what most videos do no matter how safe they are. The tame version you posted
          instead will most likely do the exact same thing. So the choice was never your daring idea against a sure
          thing. It was two posts that will probably disappear either way, and you picked the one less likely to catch on
          before it went.
        </p>

        <h2>Your gut is doing the wrong math</h2>
        <p>
          You did not weigh those odds and choose the safe one. Something faster than weighing did it for you. Winning
          and losing do not register as the same size. The pain of a loss runs{" "}
          <a href="https://thedecisionlab.com/biases/loss-aversion" target="_blank" rel="noopener noreferrer">
            about twice as strong as the pleasure of an equal gain
          </a>{" "}
          (Kahneman and Tversky called it loss aversion), so the imagined sting of the bold post flopping feels heavier
          than the imagined lift of it hitting, even when the hit is the larger and more useful outcome, and your gut
          quietly picks the option that avoids the sting.
        </p>
        <p>
          Loss aversion is a good instinct when you actually have something to lose. It stops people from risking what
          they cannot afford to. What it does not do is check whether there is anything there to protect in the first
          place. On a small account you are flinching from a loss that cannot happen, because you cannot damage a
          standing you have not built. It is famous-person defense running on an unknown-person account, and it is
          spending your best years being careful.
        </p>

        <h2>Being unknown is a budget you keep not spending</h2>
        <p>
          Turn the whole thing over. The part that feels like the problem, that hardly anyone is watching yet, is exactly
          what makes a swing cheap. Right now you can post the strange idea or the opinion you actually hold and have
          been sanding off, and if it does not land, the price is one ordinary quiet day. Take that same swing two years
          and forty thousand followers from now and it is a heavier bet, because by then there is an audience with an
          expectation and a version of you they followed for. The freedom to be wrong in public and pay almost nothing
          for it is a real asset, and it is the rare one that shrinks as you grow. You are holding a budget for
          experiments that runs out the moment it starts working, and you keep spending it on the post nobody could
          object to.
        </p>
        <p>
          Which is the other half of the cost, because the post nobody could object to is also the post nobody has a
          reason to care about. The feed carries the thing that is not the middle, the video with an edge or a real
          reason to send it to a friend. Sand a post down until it is safe and you have usually sanded off the same
          corners that would have made it travel. So playing it safe charges you twice, once for the swing you skipped
          and once for the flat thing you posted in its place.
        </p>

        <h2>Spend it before it is worth something</h2>
        <p>
          None of this is a case for being reckless or saying things you do not mean to get a rise. It is a case for
          catching yourself in the small moment you reach for the tamer version and asking what you actually think you
          are guarding. Most of the time it is a picture of yourself as someone with a reputation on the line, and that
          picture is running well ahead of the facts. The plain truth is that the reputation you keep protecting is the
          one those braver posts would have built for you.
        </p>
        <p>
          You can guard the empty room, or you can put something in it. The next time you catch yourself reaching for the
          safe version, post the one you are a little embarrassed by instead. At your size it costs you almost nothing,
          and it is the only kind of post that was ever going to make you someone worth recognizing.
        </p>
      </Article>
    </>
  );
}
