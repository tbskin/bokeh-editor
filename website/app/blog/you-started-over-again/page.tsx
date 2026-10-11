import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-started-over-again")!;

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
          You did it again. A new account, or the old one scrubbed back to nothing, a new name and a first post that
          promises this time it is for real. It felt clean. It always does.
        </p>
        <p>
          Starting over feels like the responsible move, the serious version of you finally showing up after a stretch
          of half effort. It is usually the opposite. Starting over is the most expensive thing a creator can do, and
          the pull to do it tends to arrive at the exact moment staying would have started to pay.
        </p>

        <h2>A clean page hides the old one</h2>
        <p>
          The pull toward a blank slate is well documented. Researchers who tracked gym
          visits, diet searches, and fresh commitments to a goal found that all of them spike right after a temporal
          landmark, the start of a new week or month, a birthday, the new year. Gym attendance{" "}
          <a
            href="https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901"
            target="_blank"
            rel="noopener noreferrer"
          >
            rose by roughly a third at the start of a new week
          </a>
          . The calendar did not make anyone fitter. What a landmark does is file your past under a previous chapter, so
          the slow weeks and the missed days belong to an older version of you, and the new one gets to start even.
        </p>
        <p>
          A fresh account is that same move, available any day you decide you want it. The weeks you did not post, the
          videos that went nowhere, all of it gets handed to the person you used to be. The relief is genuine, and it is the whole appeal. But look at what actually changed. Not the work, not
          whether people want what you make. You changed how the record feels to you, and left everything true about it
          in place.
        </p>

        <h2>The only things that compound are the ones you keep</h2>
        <p>
          Two things in this get better the longer you stay, and both snap back to zero the second you start over. The
          first is your body of work. A short video does not expire the day you post it. The feed keeps re-checking old
          posts and can wake one up months later through search or a subject that circles back, which means a back
          catalog is a stack of tickets still sitting in the draw. Open a new account and you throw the whole stack out
          on purpose, right before some of them would have hit.
        </p>
        <p>
          The second is recognition, and it is the slower and more valuable of the two. A scattered stranger becomes
          part of your audience only by bumping into you more than once, until your face and your name stop reading as
          new. That is the thing you are really building, and it is barely visible while it happens. A new handle asks
          every one of those people to meet you cold all over again. The person who almost followed you last month, who
          would have followed on the third video, has no idea the new account is even you. You did not skip the hard
          part by restarting. You paid for it twice.
        </p>

        <h2>The itch comes right before it works</h2>
        <p>
          The timing is the cruel part. The urge to wipe everything and begin again is strongest exactly when
          the current thing is closest to working, because that is when the flat stretch feels most unfair. You have
          posted long enough that the early novelty is gone and the count has stalled, and the growth quietly building
          underneath has not surfaced yet, because the follower number is the last thing to move. In that gap, when you
          have done the work but cannot yet see the result, a clean slate looks like the answer.
        </p>
        <p>
          So people walk away from the thing a few weeks before it would have turned, and file it as a fresh start
          rather than a retreat. That is quitting with better branding. A restart lets you leave something that was not
          paying off yet without admitting to yourself that you left, which is why it feels so much cleaner than simply
          stopping, and why the same person does it again the next time the count goes quiet. Do it every few months and
          you are not building anything. You are staying on video one on purpose, forever meeting the world for the
          first time.
        </p>

        <h2>A turn is not a demolition</h2>
        <p>
          The way out is to notice that you are allowed to change without leveling the ground first. You can change the
          subject, or get serious in a way you were not before. None of that requires a new account, and treating change
          and restart as the same act is the whole error. A pivot is a turn on a road you are already on, and the back
          catalog and the people who know you stay with you through the turn. Keep the account. Keep the record, awkward
          parts and all. Let the next video be the next one, not the first one.
        </p>
        <p>
          Every creator you would name has a run of early stuff they would rather you not scroll back to find. They did
          not delete it and begin again with a clean face. They kept posting through it, and the good years sit on top
          of the clumsy ones precisely because the count underneath never got reset to zero. From the outside that
          patience reads as talent. A lot of it is just refusing to start over.
        </p>
        <p>
          A blank slate is not a beginning. It is the same middle, restarted, with the one thing that was finally
          starting to work thrown out to buy the feeling of a clean start. The next time that itch shows up, and it
          will, do the harder and quieter thing. Stay on the page you already have.
        </p>
      </Article>
    </>
  );
}
