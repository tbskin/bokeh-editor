import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("nobody-has-a-short-attention-span")!;

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
          It is late and you are adding another cut. A zoom on one word, a little whoosh on the next, a caption that
          snaps in, a new angle every couple of seconds so the frame never once sits still. The video was fine. You are
          not adding these because it needs them. You are adding them because somewhere along the way you picked up the
          rule that people have the attention span of a goldfish now, and that if the screen holds still for even a
          second, they are gone.
        </p>
        <p>
          The rule is wrong, and it is worth starting with the goldfish, because almost nobody repeating it knows where
          it came from. The eight-second figure gets pinned on a 2015 Microsoft report, but that is not where the
          goldfish claim was actually born. A BBC reporter went looking for the real source and traced it to a data
          company whose citations he{" "}
          <a href="https://www.swordandthescript.com/2022/02/goldfish-attention-span/" target="_blank" rel="noopener noreferrer">
            could not verify at all
          </a>
          , whose listed researchers had no record of the study, and who never wrote back when he asked. The number was
          made up. So was the part about the fish.
        </p>
        <p>
          And look at what people actually do. The same person who supposedly cannot last eight seconds will sit through
          a three-hour podcast, or lose a whole evening to videos about a hobby they do not even have. The researchers
          who study this keep landing on the opposite of the myth: people have a{" "}
          <a href="https://www.forbes.com/sites/shanesnow/2023/01/16/science-shows-humans-have-massive-capacity-for-sustained-attention-and-storytelling-unlocks-it/" target="_blank" rel="noopener noreferrer">
            large capacity for sustained attention
          </a>
          , and a story is what unlocks it. Attention was never the short thing. Something else runs out.
        </p>

        <h2>What actually runs out</h2>
        <p>
          What runs out is patience for being bored. That is a different thing from attention, and the difference is the
          whole game. Give someone a reason to keep watching and they will stay far past any eight seconds. Take it away
          and they leave, no matter how short the video is. The moment a person scrolls is almost never the moment their
          attention expired. It is the moment they stopped wanting to know what happens next.
        </p>
        <p>
          Fast cuts blur those two together. Motion keeps the eyes busy. It does close to nothing for whether the mind
          wants to stay. You can hold someone&apos;s eyes and lose them completely, have them watching and not caring,
          sitting through your video the way you sit through a loading screen, waiting for a reason that never arrives.
        </p>

        <h2>The cut is treating the symptom</h2>
        <p>
          So when you feel a video sag in the middle and reach for another cut, you are treating the wrong thing. The
          wandering eyes are a symptom. The reason they wandered is that nothing in the video was pulling them forward,
          and a zoom does not add a reason. It just adds noise. Worse, a video that never sits still starts to read as a
          video with nothing worth sitting still for. All that motion can quietly tell a viewer that you are distracting
          them because the thing itself will not hold their interest.
        </p>
        <p>
          Think about the last video that genuinely held you. There is a decent chance it was not fast at all. Someone
          talking straight to camera, barely edited, and you stayed because they had started saying something you needed
          to hear the rest of. The pace was not the point. The thing they were saying was.
        </p>
        <p>
          The editing tools made the trap easy to fall into. Adding effects got fast and cheap, and it feels like real
          work, so it becomes the thing you do instead of the harder thing, which is making a video someone would want to
          finish even if you shot it in one plain take. You can spend two hours making a boring video faster. It is still
          boring, now with motion.
        </p>

        <h2>What actually holds a person</h2>
        <p>
          The thing that holds a person is a question they want answered. A psychologist named George Loewenstein
          described curiosity as the feeling of a{" "}
          <a href="https://psychologyfanatic.com/information-gap-theory/" target="_blank" rel="noopener noreferrer">
            gap between what you know and what you want to know
          </a>
          , and that gap works like a small itch. Once it is open, a person will stay to close it, and they will forgive
          a lot of slow footage on the way. It also has a shape worth knowing. The gaps that pull hardest are specific
          and feel reachable, a single clear thing just out of view, not a vague promise of value someday.
        </p>
        <p>
          Which means the real work happens before you ever open the editor. It is deciding what question the video puts
          in someone&apos;s head in the first ten seconds, and then not answering it too fast. Name the thing they are
          going to get and make them wait one beat for it. Set up a turn and hold the outcome back. Start a story and
          step away from the ending. None of that is an editing move. It is a writing move, and it does more for how long
          people watch than every transition in the app put together.
        </p>

        <h2>Slow down</h2>
        <p>
          So the next time it is late and you are reaching for one more effect, ask a different question than is this fast
          enough. Ask whether there is any reason to still be watching at second fifteen. If there is, you will find you
          barely need the cuts. If there is not, no cut will save it, and the hours you are about to spend will only make
          a dull video move quickly.
        </p>
        <p>
          The goldfish was never real. The boredom is. Fix that, and you are allowed to slow down.
        </p>
      </Article>
    </>
  );
}
