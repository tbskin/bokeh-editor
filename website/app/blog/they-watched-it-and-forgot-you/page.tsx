import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("they-watched-it-and-forgot-you")!;

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
          A video does okay. A few thousand people watch it, some of them like it, a handful even tap follow. It feels
          like progress, like it is finally building toward something. Then you post again a week later and those same
          people scroll past you without a flicker. Not a rude scroll. A blank one. They watched you, and they do not
          know it is you.
        </p>
        <p>
          You can be watched by thousands of people and be a stranger to every one of them. Getting watched and getting
          remembered are two different things, and almost everyone pours everything into the first one and never thinks
          about the second. That is the gap that quietly keeps a lot of decent creators stuck. They keep trying to fix
          their views when the real problem is that nobody remembers them.
        </p>

        <h2>A watch does not add up on its own</h2>
        <p>
          The quiet belief under most people&apos;s effort is that views accumulate. Each one is a small deposit, and if
          you keep making good videos the deposits stack into an audience. It is a nice model and it is not how the feed
          works. The feed is built to meet people cold, every time. Your video is not shown to a room that has been
          following along. It is dropped in front of whoever the app thinks will watch it right now, most of whom have
          never seen you and will never see you again.
        </p>
        <p>
          Even the ones who followed mostly do not come back on their own. On Instagram a typical post now reaches{" "}
          <a href="https://www.outfame.com/blog/instagram-organic-reach-statistics" target="_blank" rel="noopener noreferrer">
            well under ten percent of an account&apos;s own followers
          </a>
          , and smaller accounts do only a little better, somewhere around eight to fifteen percent. So a person can
          watch three of your videos over a month, scattered between a hundred other clips, and never register that it
          was the same account three times. You did not lose them. You were never a them to begin with. You were three
          separate strangers who happened to share a face.
        </p>

        <h2>The thing that actually compounds is being recognized</h2>
        <p>
          Here is what does add up, if you let it. Recognition. The second, third, fourth time someone sees you and
          something clicks into place, oh, this person again. Psychologists have a plain name for why that matters. It is
          called the{" "}
          <a href="https://simplyputpsych.co.uk/psych-101-1/the-mere-exposure-effect-how-familiarity-shapes-our-preferences" target="_blank" rel="noopener noreferrer">
            mere exposure effect
          </a>
          , and it is one of the most reliable findings in the field. People come to like things simply because they
          have seen them before. In the original experiments, people preferred shapes and symbols they had been shown
          earlier, even when they could not consciously remember seeing them at all.
        </p>
        <p>
          The reason is almost disappointingly simple. A familiar thing is easier for your brain to process, and your
          brain reads that ease as a small good feeling and mistakes it for liking or trust. Recognizing you is
          effortless in a way that meeting you is not, and the effortlessness feels like warmth. That is what is actually
          under every audience anyone has built. Not one perfect video, but a face the feed keeps handing back to people
          until it stops feeling like a stranger&apos;s.
        </p>
        <p>
          Marketers have an old rule of seven, the idea that someone has to run into you about seven times before they
          act. The exact number is basically{" "}
          <a href="https://anartfulscience.com/insights/rule-of-7-marketing/" target="_blank" rel="noopener noreferrer">
            made up
          </a>
          , nobody ever proved it and the earliest research on this put it closer to three. But the direction is not made
          up. Once is not enough to be remembered, and the whole game is stacking the times someone runs into you until
          you tip over from stranger into familiar.
        </p>

        <h2>You were told to be versatile, and it made you forgettable</h2>
        <p>
          So why is this so hard, when it sounds like it should happen automatically? Because the advice everyone gives
          you works directly against it. Try every format. Jump on every trend. Do not get stale. Reinvent. Keep them
          guessing. Follow that, and every video looks and sounds like it came from a different person. Different opening,
          different subject, a different you every week, chasing whatever the feed happened to reward.
        </p>
        <p>
          The trap is that this genuinely works for any single video. Novelty gets pushed. A fresh take on a hot trend
          can outperform your usual thing. So the feedback you get, post by post, rewards the exact behavior that keeps
          you unrecognizable. You win the video and lose the audience, and because the video is the thing you can see the
          numbers on, you never notice what the versatility cost you. There is nothing running through your work for a
          person to catch onto. Every post is a first impression, forever.
        </p>
        <p>
          This is the part that sounds backwards. The versatility you were praised for, the range, the ability to do a
          bit of everything, is often the reason nobody can hold a picture of you in their head. A person the feed cannot
          summarize in one line is a person it cannot help anyone remember.
        </p>

        <h2>Keep something the same on purpose</h2>
        <p>
          The fix is not a gimmick or a catchphrase you say into the camera. It is quieter than that. Pick one or two
          things and refuse to change them. It can be the subject you stay on, the way you open, a look, the way you
          sound when you are actually interested in something. Let everything else move. What matters is that a person
          who saw you last month has one solid handle to grab you by this month, before they even read your name.
        </p>
        <p>
          This is not the same as posting a lot, though you have to do that too. You can show up every single day and
          still be forgettable if every day looks like a different channel. And it is not quite the same as repeating
          your point, which is worth doing for its own reasons. This is about keeping the shape recognizable, so the
          repetition has somewhere to land. The thing you are most afraid of, that you will get repetitive, that people
          will notice you always do the same move, is the exact thing that turns a scattered set of watches into a person
          they know.
        </p>
        <p>
          Most creators are trying to make the one video nobody forgets. It is the wrong target. Almost every video gets
          forgotten, yours included, and that is fine. Make ten that could only have been made by you, keep the same one
          thing steady through all of them, and let the individual videos wash out the way they always do. The people who
          come back are not the ones who remembered your best post. They are the ones who, somewhere around the sixth
          time, finally noticed it was you.
        </p>
      </Article>
    </>
  );
}
