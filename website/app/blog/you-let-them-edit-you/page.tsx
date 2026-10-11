import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-let-them-edit-you")!;

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
          You noticed it a while back. One kind of video does better than the rest. Maybe it is the one where you got a
          little heated, or the one where you said a thing everyone already agrees with but louder, or just the one with
          the sharper edge. So the next time you sat down to post, you reached for that again. Not as a strategy. It just
          felt like the obvious thing to make.
        </p>
        <p>
          That small, sensible reach is the start of something most people never feel happening to them. Your audience is
          not only watching you. It is slowly editing you, and the version it edits toward is rarely the one you would
          have chosen.
        </p>

        <h2>Your audience has a favorite version of you</h2>
        <p>
          Think about what actually happens when you post. The video goes out and a response comes back, and that
          response is never flat. Some of it is louder than the rest. A comment section lights up on one video and stays
          quiet on the next. One clip gets sent around and the one after it dies politely. That difference is
          information, and you are built to move toward it. So you make a little more of whatever got the loud response
          and a little less of whatever got the shrug. Each move is small. None of them feels like a decision.
        </p>
        <p>
          This has a name. The writer Gurwinder Bhogal calls it{" "}
          <a href="https://www.gurwinder.blog/p/the-perils-of-audience-capture" target="_blank" rel="noopener noreferrer">
            audience capture
          </a>
          , a self-reinforcing loop where you tell an audience what it wants to hear, get rewarded for it, and so do more
          of it. It usually gets talked about as a disease of the famous, the podcaster who got steadily more extreme,
          the influencer who became a cartoon of themselves. But it is not a big-account problem. It is the same loop
          everyone is in from the first week they post. Being famous just means you are further down it.
        </p>

        <h2>The loud version is a narrower one</h2>
        <p>
          Here is the part that decides where you end up. The response you get is not spread evenly across everything you
          could be. It piles up on the edges. The angrier take pulls more than the measured one. The bigger claim travels
          further than the careful one. This is not a flaw in your particular audience, it is roughly how attention works
          everywhere. Even in plain news headlines, researchers found that{" "}
          <a href="https://www.nature.com/articles/s41562-023-01538-4" target="_blank" rel="noopener noreferrer">
            each negative word raised the click rate by about 2.3 percent
          </a>
          . The response rewards the sharper version of a thing, so more of what worked almost always points the same
          way, toward a louder and simpler you.
        </p>
        <p>
          Follow that far enough and you get a caricature, built one reasonable step at a time. In Bhogal&apos;s essay the
          example is a man named Nicholas Perry, who started out posting about playing the violin and going vegan,
          drifted toward eating on camera because that got the response, and ended up doing extreme eating challenges. No
          single step was strange on its own. They kept turning toward the louder reaction, and the sum of all those
          small honest turns was a person they would not have set out to become.
        </p>

        <h2>Then the version becomes a cage</h2>
        <p>
          The trap springs late. By the time the loud version is the one people know you for, it is your brand, and the
          audience you gathered came for exactly that. So when you try to make the quieter, truer thing you actually
          wanted to make, it does not land. The people who followed the caricature did not follow you. They followed the
          caricature, and they will tell you the real thing is boring, or worse, that you have changed. Now you are
          performing a version of yourself you did not choose, for a crowd that will leave the moment you stop. And it
          does not feel like a cage from the inside. It feels like being wanted, which is the whole problem.
        </p>
        <p>
          You have seen the small version of this even if you never named it. The account that got known for one angry
          rant and now cannot post anything calm without disappointing people. Or the person whose saddest video did the
          best, who slowly turned into the account that is always struggling, and now feels strange posting good news.
          Nobody decided to become that. They kept giving the room more of what it clapped loudest for.
        </p>
        <p>
          This is why it matters most when you are small, which sounds backwards. A small audience has not hardened around
          a version of you yet. There is almost nothing to betray. You can change what you make and how you are on camera
          and nobody riots, because nobody has decided who you are supposed to be. The drift is real at every size, but it
          is cheapest to correct now, while the crowd is small and forgiving and still meeting you for the first time.
        </p>

        <h2>Keep a vote for yourself</h2>
        <p>
          The fix is not to stop listening. The creator who ignores the audience entirely and posts only for themselves
          into a silent room has their own kind of failure, and it is not more honest, only lonelier. Listening is fine.
          The problem is letting the count be the only voice in the room. You need one more vote in there, and it has to
          be yours.
        </p>
        <p>
          In practice that is a few small things. Decide who you are and what you are here to make before the numbers
          weigh in, and write it down somewhere you will actually see it, so you have something to check the drift against
          later. Keep some part of the work that answers to you and not the response, the video you would still make if it
          did a completely normal number. And when you notice one kind of post pulling away from the rest, do not only ask
          whether it works. Ask whether you want to be the person who makes that every week, because if it works, you will
          have to.
        </p>
        <p>
          The audience is not the villain here. A crowd just claps for the parts of you it can already see, and if you let
          the clapping do the deciding, you will keep trimming yourself down to the shape that gets the most of it. The
          version worth building is the one you would still choose with the sound off, before anyone has told you which
          parts of you they liked.
        </p>
      </Article>
    </>
  );
}
