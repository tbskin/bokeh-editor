import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-copied-what-you-could-see")!;

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
          You watch a video take off. Not yours, someone else&apos;s. You play it a few times and you can see exactly what
          it is doing, the cut that lands on the beat, the words that snap in one at a time across the bottom, the little
          pause before the payoff. So that weekend you make your own, same moves, and it goes out to nothing. You decide
          the format is burned out, everyone is doing it now, and you go looking for the next one.
        </p>
        <p>
          Here is the part that is easy to miss. You copied everything about that video you could see. The thing that made
          it work was the part you could not.
        </p>

        <h2>The part that works is usually invisible</h2>
        <p>
          Every video has two layers. There is the delivery, the stuff on the surface, the cuts and the captions and the
          sound and the exact words of the hook. And there is the thing underneath it, the reason any of that was worth
          sitting through, a real stake, or one specific person saying something only they would say. The delivery is loud
          and easy to name. The reason is quiet and hard to point at. So when you sit down to learn from a video that
          worked, you learn the loud part, because it is the only part actually in front of you.
        </p>
        <p>
          Copying the delivery of a good video gives you the delivery wrapped around nothing. Same cuts, same captions,
          same energy, and no reason to keep watching. The surface was never the thing doing the work. It was the thing
          carrying it. Take the surface on its own and you have taken the part that was only ever holding something else
          up.
        </p>

        <h2>The eye goes to the surface on its own</h2>
        <p>
          This is not something you are doing wrong. It is how people learn from any example. Researchers once handed a
          stack of physics problems to beginners and to experts and asked them to sort the problems into groups.{" "}
          <a
            href="https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog0502_2"
            target="_blank"
            rel="noopener noreferrer"
          >
            The beginners sorted by what the problems looked like
          </a>
          , inclined planes in one pile and pulleys in another, while the experts sorted by the principle that actually
          solved them, which was nowhere on the page. The beginner sees the ramp. The expert sees the physics. Reading a
          video works the same way, except here nearly everyone is the beginner, because the surface of a video is right
          there in full and the reason it worked is buried somewhere you have to go digging for.
        </p>
        <p>
          So the natural move, watch a hit and copy what you notice, aims you at the surface every single time. It is not
          laziness. It is what anyone does with an example when they cannot yet tell which parts of it matter.
        </p>

        <h2>The planes still did not land</h2>
        <p>
          Richard Feynman had a name for building the surface and waiting for the result to follow. During the war, people
          on some Pacific islands had watched planes come down and unload cargo, and after the planes stopped,{" "}
          <a href="https://people.cs.uchicago.edu/~ravenben/cargocult.html" target="_blank" rel="noopener noreferrer">
            they built their own airfield
          </a>{" "}
          from what they had, runways cleared, fires set along the sides, a man sitting in a wooden hut with two carved
          pieces on his head for headphones, waiting for the planes to return. They had reproduced everything about the
          airfield they could see. Nothing landed, because the runway was never what brought the planes. Feynman called it
          cargo cult, keeping all the outward forms and missing the one thing that made them mean anything.
        </p>
        <p>
          A video built that way runs into the same wall. It looks like the one that worked. It has the same shape, the
          same cuts. And it sits there and no planes land, because the shape was never the reason anyone watched.
        </p>

        <h2>You cannot wear out a thing you never did</h2>
        <p>
          This is where the mistake starts to cost you. When your copy flops, you reach the obvious conclusion. The format
          is played out. Everyone is on it now. You scratch it off and hunt for the next trick. But you never had the
          format, you had its costume, and you cannot wear out a move you never actually made. The version with something
          real inside it, the one that might have worked, is the one you just decided to stop making.
        </p>
        <p>
          So you settle into a loop, one surface after another, always learning the newest set of moves and always
          watching them do nothing, and a stack of flops starts to read as proof that none of it works. The real pattern
          is quieter. You have been copying the visible half of every video and leaving the half that mattered on the
          table.
        </p>

        <h2>Copy one level down</h2>
        <p>
          The fix is not to quit studying videos that do well. It is to copy one level down. When something lands, do not
          ask what did they do. Ask what were they actually giving me, and why did I stay. Sometimes it is a fact you did
          not have and wanted. Sometimes it is a person saying the honest thing most people keep tucked away. That is the
          plane. The cuts you were so busy noting are just the runway they cleared to bring it in.
        </p>
        <p>
          Then go find your own version of that thing. You have your own real point, your own reason a stranger would stay
          to the end. Put that underneath first, and the delivery mostly takes care of itself, because
          you are no longer dressing up an empty video, you are getting a full one out of the viewer&apos;s way.
        </p>
        <p>
          The strange part is that the invisible layer, the part you kept scrolling past to get to the technique, was the
          only part that was ever going to be yours. Anyone can lift a jump cut. The reason people watched the original
          belonged to the person who made it, which is exactly why it was never sitting there to be taken. All that
          copying, and the one thing worth having you already owned.
        </p>
      </Article>
    </>
  );
}
