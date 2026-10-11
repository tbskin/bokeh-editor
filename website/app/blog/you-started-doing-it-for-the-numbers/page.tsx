import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-started-doing-it-for-the-numbers")!;

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
          There was a stretch, early on, when you made videos for no reason. You would cut something together late at
          night because it felt good to line the pieces up, post it, and half forget about it by morning. Almost nobody
          watched and it did not matter, because the making was the part you liked.
        </p>
        <p>
          Then a couple of them did okay. You decided to take it seriously. You started checking the count the second you
          hit post, refreshing it on the walk back to your desk. And somewhere in there the thing you used to do for fun
          turned into a job you are not sure you are any good at. You call it burnout, or the grind. It is quieter than
          that. You changed why you were doing it.
        </p>

        <h2>A reward can eat the reason</h2>
        <p>
          There is an old study people still argue about, and the core of it has held up. At a preschool on the Stanford
          campus, researchers found kids who already loved drawing with markers. They promised one group a prize for
          drawing, gave a second group the same prize as a surprise, and left a third group alone. Later they watched who
          picked the markers back up on their own. The kids who had been promised the prize{" "}
          <a href="https://explorable.com/overjustification-effect" target="_blank" rel="noopener noreferrer">
            spent about half as much time drawing
          </a>{" "}
          once the prize went away. The surprise group and the left-alone group were unchanged.
        </p>
        <p>
          The strange part is that nothing was taken from the promised kids. They got a prize. But the prize quietly
          answered a question they had never bothered to ask. Why am I drawing. Before, the answer was because I like it.
          After, the answer was for the prize, and when the prize stopped, the reason stopped with it. A reward for
          something you already wanted to do does not sit neatly on top of the wanting. It can move in and take its place.
          Psychologists gave this a clumsy name, the overjustification effect, and a{" "}
          <a
            href="https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            review of 128 experiments
          </a>{" "}
          found the same shape in adults doing all sorts of tasks. Pay people for a thing they already enjoyed and they
          tend to enjoy it less once the pay is gone.
        </p>
        <p>
          The numbers are exactly that kind of reward. Views, likes, the little count that ticks up under the post.
          Nobody hands them to you, but they do the same job the prize did. They give you a reason from outside for a
          thing you used to do for a reason from inside, and once the outside reason is running the show, the inside one
          goes quiet.
        </p>

        <h2>The paymaster mostly pays nothing</h2>
        <p>
          This would be a fair trade if the numbers paid reliably. They do not, and least of all at the start. Most posts
          do an ordinary number, a few do worse, and once in a while one does well, on no schedule you can plan around. If
          the count is your reason for making, then most of the time you are working for a wage that does not arrive, and
          the one that does show up comes maybe once a month.
        </p>
        <p>
          The reason you started with never worked like that. Making the thing paid every single time, win or lose,
          because the payment was the making. That is not a soft point. It is the only fuel that is actually in the tank
          during the long early stretch when the numbers are not there yet, which is most of the first year for most
          people. So the switch from doing it because you like it to doing it for the numbers trades a fuel that is always
          there for one that is mostly empty, and it makes the trade at the exact moment you need the tank full.
        </p>

        <h2>You can feel it happen</h2>
        <p>
          The tell is small and specific. You make something you are genuinely proud of, it does 800 views, and you
          cannot enjoy it. Not because 800 is nothing, it is a room full of people, but because the scoreboard said so
          and the scoreboard is now how you feel about your own work. The making, the part that used to be the whole
          point, does not count for anything anymore unless the number signs off on it.
        </p>
        <p>
          Once that flips, every post becomes a small bet you mostly lose, and a thing you used to do to feel better
          becomes a thing that mostly makes you feel worse. That is not thin discipline or a character flaw. It is what
          happens to any activity once its entire value gets moved onto an outcome you do not control. You did not run
          out of motivation. You moved it somewhere it could not survive.
        </p>

        <h2>Numbers are feedback, not a reason</h2>
        <p>
          The fix is not to look away from the numbers. You need them, but for one narrow job. They are feedback, the
          information about what landed and what did not, read after the fact so the next video is a little sharper. That
          is a different job from being the reason you make the next video at all. Feedback you glance at on Friday. A
          reason you carry every day. Let the numbers do the first job and keep them out of the second.
        </p>
        <p>
          Protecting the reason is almost too simple to write down. Keep making at least some things you would have made
          even if you had known, going in, that no one would see them. Not everything. But if you look back at your last
          ten posts and every one was picked because you thought it would perform, the engine is already running on the
          empty tank, and one slow month will stall it. The whole test is a single question, asked before you post rather
          than after. Would I be glad I made this even if it did nothing. If the honest answer is yes often enough, a
          quiet week cannot really touch you, because you already got paid.
        </p>
        <p>
          The people still here in year three are not the ones who wanted it more. A lot of them wanted it less, in one
          exact way. They never fully handed their reason for making over to the count. They kept a corner of the work
          that stayed theirs, made for reasons the feed cannot pay out and cannot take back, and that corner is what kept
          the lights on through every month the numbers forgot they existed.
        </p>
      </Article>
    </>
  );
}
