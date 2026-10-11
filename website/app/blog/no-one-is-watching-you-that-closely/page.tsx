import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("no-one-is-watching-you-that-closely")!;

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
          You filmed a good clip. Somewhere in the middle you stumbled over a word, or your face did a thing, or the light
          shifted for half a second. You noticed. So you shot it again, and again, and by take nine the words are clean and
          you sound like a person reading a hostage note. The clip is still sitting in your drafts a week later because of
          one moment you cannot stop seeing.
        </p>
        <p>
          Here is the part worth sitting with. Nobody else saw it. Not because they are being kind, but because they were
          never looking that closely in the first place.
        </p>

        <h2>You are watching a different video than they are</h2>
        <p>
          When you play your own clip back, you are not really watching a video. You are auditing yourself. You know the
          flub is coming, so you brace for it, and when it lands it fills the whole screen. A viewer is doing none of that.
          They are half watching, thumb ready, deciding in a second or two whether the point is worth staying for. They are
          watching the idea. You are watching your chin.
        </p>
        <p>
          Psychologists have put a number on this. Researchers sent students into a room wearing a T-shirt with an
          unfashionable singer on it, then asked how many people had noticed.{" "}
          <a
            href="https://www.researchgate.net/publication/12609065_The_Spotlight_Effect_in_Social_Judgment_An_Egocentric_Bias_in_Estimates_of_the_Salience_of_One%27s_Own_Actions_and_Appearance"
            target="_blank"
            rel="noopener noreferrer"
          >
            The wearers guessed about 46 percent. The real number was 23
          </a>
          , roughly half of what they feared, and that shirt was the whole event of their afternoon. It runs the other way
          too. When they ran it again with shirts people were actually proud to wear, the wearers expected about half the
          room to recognize the face on the front. Eight percent did. Now shrink any of that to your own face, in a two
          second clip, sitting in a feed next to forty other clips. The thing you are certain everyone will clock, a
          fraction of them do, and the ones who do have forgotten it before the next video loads.
        </p>

        <h2>The awkwardness is mostly in your head</h2>
        <p>
          The bigger fear is not one bad frame, it is the whole thing. I look stiff. I sound nervous. I am just not a
          natural on camera. Almost everyone who films themselves believes some version of this, and almost everyone is
          wrong about how much of it actually reaches the other side.
        </p>
        <p>
          Nervousness is loud from the inside. Your heart is going and you are sure it is written all over your face. It
          mostly is not. When researchers had people give unrehearsed speeches, the speakers were convinced their nerves
          were obvious, and the listeners{" "}
          <a
            href="https://www.sciencedirect.com/science/article/abs/pii/S0022103103000568"
            target="_blank"
            rel="noopener noreferrer"
          >
            barely picked up on them
          </a>
          . What the feeling is like on the inside and what it looks like from the outside are almost two separate things.
        </p>
        <p>
          The useful part comes next. In that same work, speakers who were simply told this, that their nerves were far
          less visible than they felt, went on to{" "}
          <a href="https://sixminutes.dlugan.com/illusion-of-transparency/" target="_blank" rel="noopener noreferrer">
            give noticeably better talks
          </a>{" "}
          and felt calmer doing it. Nothing about their skill had changed. What changed is that they stopped spending half
          their attention watching themselves for signs of failure. That watching is the real problem. The stiffness you
          are trying to edit out is often caused by the very act of monitoring yourself for stiffness.
        </p>

        <h2>Careful is not free</h2>
        <p>
          None of this would matter if perfectionism came free. It does not. Every re-shoot is an hour you will not get
          back, and every clip that sits in drafts for a week over one bad second is a video that simply never went out.
          The bump you stayed up sanding down, the one nobody would have felt, cost you the night you could have spent
          making the next thing, and the next thing is the move that reliably works.
        </p>
        <p>
          And past a point the polish turns on you. A clip worked so smooth that every edge is gone starts to read as an ad,
          and people skip ads on reflex. The little stumble you hate is often the exact thing that made you look like a
          person instead of a brand. So you are not only wasting the hour. Some of the time you are editing out the reason
          it would have landed.
        </p>
        <p>
          You could push back here, and you would have a point. Standards matter, and some things really are too rough to
          post. True. Keep a floor, and under the floor, do not post it. The trouble is that most people are not hovering at
          the floor. They are ten passes above it, polishing for an audience of one, themselves, the only person who was
          ever going to notice the thing they are fixing.
        </p>

        <h2>Ask the scroll test, not the mirror test</h2>
        <p>
          So change the question you ask before you post. Not is there anything wrong with this, because there is always
          something wrong with it. You made it and you have watched it too many times to see it straight. Ask instead
          whether a stranger with their thumb already moving would even register the thing you are about to spend an hour
          fixing. Play it once, at normal speed, the way they will. If you have to slow it down or watch it twice to catch
          the flaw, they are never going to catch it at all.
        </p>
        <p>
          What tends to happen is that the person who stops hunting for their own mistakes comes across looser and more
          watchable than the one who scrubbed every frame. The audience was never studying you. The day you stop studying
          yourself is the day you finally hand them the version they would have liked all along.
        </p>
      </Article>
    </>
  );
}
