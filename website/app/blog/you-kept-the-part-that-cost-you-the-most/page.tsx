import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-kept-the-part-that-cost-you-the-most")!;

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
          You spent the whole evening on one video, and the part you are proudest of is almost always the part that took
          the longest. The intro you reshot eight times until it felt right. The transition you paused to learn a new
          trick for. The b-roll you drove across town to get. Those stay in, no question, because look what they cost
          you.
        </p>
        <p>
          Then you watch a stranger scroll past the exact part you bled over. They do not slow down for it. They cannot
          see the eight takes, they do not know about the drive, and to them the intro is just a slow intro they are
          already leaving. The hours you put in are quietly making your keep-and-cut decisions, and they are the one
          thing in the room that should count for nothing.
        </p>

        <h2>What the effort is actually telling you</h2>
        <p>
          The work a piece of a video took you has nothing to do with how good it is for the person watching. Sometimes
          the hard part is great. Often the hard part was hard because it was fighting you, and it was fighting you
          because it did not belong there. But your hand hovers over the cut and something stops it, and that something
          is not a read on the video. It is the memory of the evening.
        </p>
        <p>
          There is a plain name for this. In 1985 two psychologists, Hal Arkes and Catherine Blumer, sold theater season
          tickets to people at three different prices, some full and some at a random discount, then watched who actually
          turned up. The people who had paid full price{" "}
          <a
            href="https://www.sciencedirect.com/science/article/abs/pii/0749597885900494"
            target="_blank"
            rel="noopener noreferrer"
          >
            attended more of the plays
          </a>{" "}
          over the first half of the season. Same shows, same seats. The only difference was how much they had already
          sunk, and the ones who had sunk more could not stand to let it go to waste. That is the whole thing, and notice
          it says nothing about whether the next play was any good.
        </p>
        <p>
          The tell is a reason for keeping something that starts with the time you have in it. I already spent three
          hours on this. I am not throwing out that shot after what it took to get. The moment the case for a piece of
          the video is about what it cost you rather than what it does for the person watching, that is the sunk evening
          talking, and it is a bad judge with a loud voice.
        </p>

        <h2>An edit is the perfect trap for it</h2>
        <p>
          An edit is one of the cleanest versions of this you can walk into, because the cost is loud and the value is
          silent. The cost is your Tuesday night, felt in your own body and remembered in detail. The value is a flicker
          of interest in a stranger you will never meet, that has not happened yet and might not. When one side of the
          scale is shouting and the other side is mute, you weigh the side that is shouting. So the shot that cost the
          most starts to feel like the shot that is worth the most, when the two were never connected in the first place.
        </p>

        <h2>It pushes you two ways and both are bad</h2>
        <p>It works in opposite directions depending on the night.</p>
        <p>
          Some nights it will not let you stop. The video is not working and you know it is not working, and instead of
          binning it and starting something better, you keep pouring hours in, because the hours already in there have to
          be rescued somehow. This is the Concorde, the supersonic jet Britain and France kept funding for years after it
          was clear it would{" "}
          <a
            href="https://www.aviationfile.com/the-concorde-fallacy-a-cautionary-tale-about-sunk-costs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            never pay for itself
          </a>
          , because so much had already been spent that quitting felt like admitting the spending was wasted. It flew,
          beautifully and at a loss, until 2003. You have built small Concordes on a laptop at midnight, re-cutting a
          video that was dead on the first pass.
        </p>
        <p>
          Other nights it makes you ship. The video is fine, not good, and you can feel that it is only fine, but you
          post it anyway, because throwing out a whole evening is unbearable in a way that posting a weak video somehow is
          not. And you will tell yourself this is discipline, just get it out, stay consistent. That is not the reason.
          You did not decide to post it. The sunk evening decided for you, and consistency was the cover story.
        </p>
        <p>
          Both of these feel like conviction from the inside. Neither one is. One is you trying to rescue a Tuesday and
          the other is you trying to bury it, and in both the video is a bystander to an argument about your own time.
        </p>

        <h2>The stranger got it for free</h2>
        <p>
          The fix is a small and almost stupid trick, and it works because it deletes the one number that is lying to
          you. Before you decide whether to keep a shot, or whether to post the thing at all, imagine someone else shot
          the footage and handed it to you this morning. You did nothing to make it. It cost you no time and no pride.
          Now, cold, would you keep this part. Would you put your name on this video.
        </p>
        <p>
          That question is hard to ask because it stings, and it stings in the exact place the sunk cost was guarding.
          The shot you loved making is often the first one that should go. The video you gave a whole night to is
          sometimes one you would never have posted if it had shown up for free. That sting is not a reason to trust the
          effort more. It is the sign the effort was running the decision the whole time.
        </p>
        <p>
          And the viewer already lives in that world. They really did get it for free. They did not pay your evening,
          they will never feel your eight takes, and they are judging the thing in front of them as if it fell out of the
          sky, because for them it did. The only person still paying for those hours is you, in worse calls about what to
          keep and what to send. The work ends the second you finish it. What is left is a video, and it does not owe
          your evening a thing.
        </p>
      </Article>
    </>
  );
}
