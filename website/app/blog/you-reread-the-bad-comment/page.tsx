import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-reread-the-bad-comment")!;

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
          A video does its numbers. Forty kind comments, a pile of likes, a few saves from people who wanted to keep it.
          And one person left something short and unkind. You already know which comment you will still be thinking about
          tonight. Not the forty. The one.
        </p>
        <p>
          That is not a flaw in you, and it is not a shortage of confidence. It is one of the most dependable things about
          the human mind, and if you leave it alone it will slowly start deciding what you make next.
        </p>

        <h2>Bad is louder than good, before you decide anything</h2>
        <p>
          The mean comment feels bigger, but not because it is more true. It feels bigger because your brain is built to
          weigh it more. In a long review of the research called{" "}
          <a
            href="https://journals.sagepub.com/doi/abs/10.1037/1089-2680.5.4.323"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bad Is Stronger Than Good
          </a>
          , psychologists found the same pattern almost everywhere they looked. Bad feedback and bad first impressions
          land harder and stick around longer than good ones of the same size, and when good and bad turn up in equal
          amounts, the bad ones win the day.
        </p>
        <p>
          It runs deeper than mood. When researchers{" "}
          <a href="http://www.wisebrain.org/papers/NegativityBias.pdf" target="_blank" rel="noopener noreferrer">
            measured the brain&apos;s electrical activity
          </a>{" "}
          while people looked at pictures, a negative image set off a stronger response than a positive one of equal
          intensity, and it happened in a fraction of a second, before anyone had consciously judged a thing. The insult
          and the compliment never get an even hearing. Your attention goes to the bad one first and hands it more room,
          automatically, before you have decided anything. By the time you feel it, the scoring is already tilted.
        </p>
        <p>
          So the tally in your head is not the real tally. Forty to one, from the inside, can feel like a loss.
        </p>

        <h2>The sting is not information</h2>
        <p>
          What makes this dangerous is how convincing the feeling is. It does not arrive labeled as a wired overreaction.
          It arrives as a quiet certainty that they had a point, so you scroll back and read the comment again, and then
          again, hunting for the thing to fix.
        </p>
        <p>
          There is just enough truth in it to keep you there, because criticism really is more specific than praise. Kind
          comments tend to say it is great, and mean ones tell you exactly what they hated, and that detail makes the bad
          one feel useful. But specific is not the same as right, and it is nowhere near the same as common. The person
          who typed it is one person, and usually the one least like the people you are actually making things for.
        </p>
        <p>
          It helps to remember who writes comments at all. The people who quietly liked the video and kept scrolling wrote
          nothing. The ones who watched the whole way through and saved it wrote nothing. Typing takes a reason, and mild
          approval is a weak one, while irritation is a strong one. So the comment box is not a poll of the room. It leans
          toward whoever felt something sharp enough to stop and use their thumbs, and annoyance clears that bar far more
          easily than quiet appreciation ever does.
        </p>

        <h2>Then it quietly edits the next one</h2>
        <p>
          Here is where the real cost lands, and it is not the bad evening. You sit down to make the next video and,
          without ever choosing to, you make it a little safer. You cut the line the critic would have mocked, and you add
          the caveat that heads off the well-actually. What you are sanding down, without noticing, is the exact edge that
          made the last one feel like yours. Each move is small, and each one feels like getting better at this.
        </p>
        <p>
          None of it shows up as a decision you could point to later. There was no day you sat down and thought, today I
          will make blander videos to keep the critics quiet. There is only a year of small, reasonable flinches, and an
          account at the end of it with the edges filed off and no clear memory of where they went. In the moment, the safe
          version always felt like the grown-up choice, which is exactly what makes it so easy to keep making.
        </p>
        <p>
          The sum is a video shaped around one person who was never going to like you. You have started making things for
          your critics instead of the people who showed up, and those are not the same audience. The forty who liked it
          wanted more of what you did. The one who did not was asking for a different creator. You cannot serve both at
          once, and the wiring keeps nudging you toward the one you will never win.
        </p>

        <h2>Count patterns, not stings</h2>
        <p>
          The fix is not a thicker skin, and it is not waving off every criticism, because sometimes the note is real and
          you want it. The fix is to change what you let count. A single harsh comment is a feeling. A pattern is a fact.
          If ten different people, without prompting, say the audio was hard to hear, that is a note worth acting on. One
          stranger calling you annoying is just one stranger&apos;s afternoon.
        </p>
        <p>
          The practical version is a delay. When a comment stings, do nothing with it that day. Do not edit around it, do
          not reply, do not shelve the idea it poked at. Come back in the morning. The sting will have faded, and either
          the information underneath is still standing or it is gone, and now you know which it was. While you are there,
          read your saves and your kind comments with the same care you were about to spend on the mean one, because right
          now you are grading the two on completely different scales.
        </p>
        <p>
          The person who got to you was one viewer with a keyboard and a bad afternoon, and you were about to let them
          art-direct everything you make for the next month. They do not get that job. They were barely in the room.
        </p>
      </Article>
    </>
  );
}
