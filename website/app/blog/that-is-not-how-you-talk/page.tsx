import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("that-is-not-how-you-talk")!;

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
          You hit record and something happens to your voice. It climbs a little. It gets brighter and faster than you
          actually are at two in the afternoon. Hey guys. Welcome back. The words come out with an
          energy you were not carrying ten seconds ago, when you were just a person deciding to film something.
        </p>
        <p>
          A friend watching would catch it right away. That is not how you talk. And here is the uncomfortable part, the
          stranger catches it too, in the first second, before you have said a single thing worth staying for.
        </p>

        <h2>Everyone can feel a performance</h2>
        <p>
          People are very good at spotting when they are being performed at. We spend all day being sold to, so we build
          a quiet detector for it, the thing researchers call{" "}
          <a
            href="https://link.springer.com/article/10.1007/s13162-023-00254-6"
            target="_blank"
            rel="noopener noreferrer"
          >
            persuasion knowledge
          </a>
          , a running sense of when someone is working an angle on us. The moment it trips, we stop listening to what a
          person is saying and start watching them try.
        </p>
        <p>
          A put-on voice trips it almost instantly. Not because the viewer thinks &quot;this is an ad,&quot; but because
          the register is the one they have learned to distrust. It is the tone of someone who wants something from them.
          The guard goes up on reflex, and once it is up your actual point does not get a fair read. You could be about
          to say the most useful thing in their week. They are already gone, because the packaging told them what this
          was before the content got a chance to.
        </p>
        <p>
          This is the trap in a plain sentence. The energy you add to seem worth watching is the exact thing that tells a
          stranger to keep scrolling.
        </p>

        <h2>Energy is not the same as being present</h2>
        <p>
          The advice that got you here says be dynamic. Big. Hook them with a burst. And it is not wrong that a flat,
          mumbling video loses people. Somewhere, though, that advice curdled into performing an enthusiasm you do not
          actually feel, and performed enthusiasm does not land as interesting. It lands as effort, and effort aimed at a
          person reads as a pitch.
        </p>
        <p>
          What actually holds a stranger is quieter than energy. It is the feeling that one real person is talking to
          them and not at a crowd. In a study of news viewers, people trusted the presenter more, and enjoyed the segment
          more, when{" "}
          <a href="https://journals.sagepub.com/doi/abs/10.1177/14648849231169886" target="_blank" rel="noopener noreferrer">
            the presenter spoke to them directly
          </a>{" "}
          instead of past them at some general audience. Same words, different aim. Looking at the person and talking to
          the person beat the clean broadcast read. The pull is not charisma. It is the small, powerful illusion that
          someone on the other side of the screen is actually addressing you, and that illusion breaks the second the
          delivery goes theatrical.
        </p>
        <p>
          None of this is a case for being dull. Clarity matters. Caring about the thing matters, and it shows. The enemy
          is not energy, it is the manufactured version of it, the octave you did not have before the light came on.
        </p>

        <h2>Talk to one person</h2>
        <p>
          So the fix is not be authentic, which is useless advice because nobody knows what to do with it. The fix is
          smaller and more mechanical than that. Talk to one person.
        </p>
        <p>
          Before you record, pick an actual human. Not your audience, not you guys, one specific person who would
          genuinely want this. The friend who keeps asking you the thing. Someone who left a real comment. Then say it
          the way you would say it to them across a table, at your normal volume, with your normal face. It will feel
          like you are underperforming. You are not. You are dropping the octave you added and the intro you never
          needed, and you are letting the true thing sound the plain way true things sound out loud.
        </p>
        <p>
          The sign that it is working is that it feels slightly boring while you do it. Talking like yourself always
          does, because you have heard it your whole life. On the other side of the screen it does not read as boring at
          all. It reads as a real person, which is close to the rarest thing in a feed full of people doing a voice.
        </p>

        <h2>The loud ones are not your evidence</h2>
        <p>
          You will point at the huge creators who are clearly loud and clearly performing, and figure it plainly works.
          Look closer. The loud ones who last are not wearing an energy, that is genuinely how they are, and you
          can feel that it is real, which is the entire point. A costume only reads as a costume when it does not fit.
          Copy their volume and you import the one part that was theirs and does not transfer. What actually travels is
          the thing underneath the volume, a specific person being plainly themselves, and you already have that. You
          have just been editing it out at the top of every take.
        </p>
        <p>
          The camera never asked you to be more. It caught you deciding to be someone a notch away from yourself, and the
          audience felt the swap before they heard the idea. Leave the light off in your head for a second longer. Turn
          it on and stay who you were the moment before it did.
        </p>
      </Article>
    </>
  );
}
