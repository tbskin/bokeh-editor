import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-never-wrote-the-ending")!;

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
          You will rewrite the first line of a video five times. You will film three versions of the hook, cut the intro
          down until there is no intro left, and lose an hour to the first two seconds. Then you reach the end, and
          whatever you happen to be saying when you run out of things to say becomes the ending. So yeah, that is it.
          Post.
        </p>
        <p>
          The ending is the one part you never actually wrote, and it is the part people leave holding. Not the hook. The
          last thing you said is the taste in their mouth in the half second after it stops, when they decide whether you
          were worth the time.
        </p>

        <h2>People do not remember the video. They remember the end of it.</h2>
        <p>
          There is a good deal of research on how we store an experience, and it does not work the way you would guess. We
          do not keep a running average of the whole thing. Two psychologists, Daniel Kahneman and Barbara Fredrickson,
          found that when people look back on something, they mostly recall{" "}
          <a href="https://en.wikipedia.org/wiki/Peak%E2%80%93end_rule" target="_blank" rel="noopener noreferrer">
            two moments, the most intense one and the last one
          </a>
          . The middle blurs. The end gets a vote much bigger than its size.
        </p>
        <p>
          Their proof was almost mean. People held a hand in painfully cold water for sixty seconds. Then they did it a
          second time, except now the researchers left the hand in for thirty extra seconds while nudging the water
          slightly less cold. That version was more total discomfort, more seconds of cold. When people were asked which
          one they would rather repeat, they picked the longer one, because it ended a little better. The end quietly
          rewrote the memory of the whole thing.
        </p>
        <p>
          Your video is one of these experiences, only it lasts twenty seconds and someone has a thousand of them a day.
          When they flick to the next one, they are not carrying a frame by frame record of yours. They are carrying the
          best bit and the last bit. You can land a good middle and lose all of it to an ending that just stops, because
          the ending is what gets filed.
        </p>

        <h2>The worst thing to end on is a favor</h2>
        <p>
          Watch where most videos land and it is some version of a request. Follow for more. Like the video if it helped.
          The problem is not that asking is rude. The problem is the timing. The moment your video ends is the exact
          moment the viewer is deciding, on their own, whether they want more of you. A good ending is what creates that
          pull. A request steps on it and hands them a small chore instead.
        </p>
        <p>
          You are also spending your most valuable second on the least interesting thing you could say. If the end is half
          of what they remember, closing on &quot;follow for more&quot; is choosing to be remembered as an ad. The line
          that makes someone think &quot;huh, that is actually true&quot; as they scroll away does more for you than any
          call to action, because they arrive at wanting more by themselves, and that is the only version of wanting more
          that holds.
        </p>
        <p>
          Think about the videos you have actually followed someone over. It is rarely the one that told you to. It is the
          one that ended on a line good enough that you tapped the name to check for others like it. That tap is a follow
          that felt like your own idea. Nobody has ever felt that from the words follow for more.
        </p>
        <p>
          There is a plain test here. Before you post, decide what feeling you want the viewer holding when the screen
          moves on. Then watch your last three seconds and ask whether they deliver it. Most endings deliver one feeling,
          which is that the person on camera ran out of things to say.
        </p>

        <h2>On these feeds, the end is not even the end</h2>
        <p>
          There is a second reason the ending carries more weight than it used to, and this one is mechanical. On most of
          the apps this lives on, the video does not stop when it is over. It starts again. The app loops it before the
          viewer has consciously decided anything, so your last second is pressed right up against your first.
        </p>
        <p>
          That changes what a good ending is for. End on a hard stop or a follow-for-more card and the spell breaks, the
          viewer feels the seam and their thumb moves. If the last line lands clean, or bends back toward how you opened,
          they slide into a second watch without noticing they chose to. Those replays are not views you tricked out of
          anyone. The platforms count a rewatch as{" "}
          <a href="https://smmnut.com/blog/tiktok-loop-content-strategy-2025/" target="_blank" rel="noopener noreferrer">
            one of the strongest signals that something is worth pushing
          </a>
          . Two watches out of one video, because the ending did not slam a door on the way out.
        </p>
        <p>
          None of this means build a clever loop that eats its own tail. It means stop ending on a wall. A video that
          finishes on its best beat gets watched twice by the same people who would have left if it finished on an ask.
        </p>

        <h2>Write the last line on purpose</h2>
        <p>
          The fix is almost too small to write down. Give the ending the care you give the hook. Decide what it is instead
          of letting it be the leftover. Some people write the ending first, before they touch the opening, so the whole
          video has a place to land instead of a spot where the talking happens to stop.
        </p>
        <p>
          And end on the strongest thing you have, not the ask. If someone wants more of you, they already know how to
          find your name, the video put it right in front of them. The hook is only there to buy you the watch. What they
          keep, and whether they come back, gets decided by the last thing you let them hear. You have been sweating the
          opening and leaving the part that actually stays to chance.
        </p>
      </Article>
    </>
  );
}
