import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-have-good-taste")!;

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
          You film something, watch it back once, and your stomach drops a little. In your head the idea was sharp. On
          the screen it is stiff, the timing is off, and the thing you meant to say does not quite land. So you do not
          post it. And underneath that, without ever saying it out loud, you make a quiet decision. Maybe you are just
          not good at this.
        </p>
        <p>
          I want to sit on that exact feeling, because it is the most misread moment in the whole thing. The cringe you
          feel watching your own video back is not the bad news you think it is. It is close to the only proof you have
          that you might get good.
        </p>

        <h2>The gap you are actually feeling</h2>
        <p>
          Start with the uncomfortable truth. You are right. The video is not good yet. But look at what just happened.
          You were able to watch your own work and see, accurately, that it fell short. That is a real ability, and it is
          not the same one as being able to make the video good. Judging is one skill. Doing is another. And the judging
          one shows up years before the doing one does.
        </p>
        <p>
          You built the judging half without meaning to. You have watched thousands of videos as a viewer. You know
          within a second or two when something is boring, or when someone is trying too hard. That taste is sharp, it
          has been sharp for a long time, and it is the exact thing that got you to pick up the camera in the first
          place.{" "}
          <a href="https://jamesclear.com/ira-glass-failure" target="_blank" rel="noopener noreferrer">
            Ira Glass put it
          </a>{" "}
          better than anyone. For the first couple of years the work you make is just not that good, but your taste, the
          thing that got you into the game, is still killer, and &quot;your taste is why your work disappoints you.&quot;
          The disappointment is not a readout on your talent. It is the distance between an eye that is already good and
          a hand that has not caught up.
        </p>

        <h2>The better your taste, the worse it feels</h2>
        <p>
          Now the cruel part. Picture two people who film the same mediocre first video. One of them can barely tell good
          from bad, shrugs, and films another tomorrow. The other has a real eye, watches it back, sees every flaw sitting
          right there, and feels a little sick. Same video, same skill, completely different week. And here is the turn
          that matters. The second person, the one in pain, is the one better set up to get good, because you cannot fix
          what you cannot see. They are also the one far more likely to quit.
        </p>
        <p>
          So the sharper your taste, the more your early work hurts, and the more it hurts, the louder the voice telling
          you to stop. The people who give up in the first month are not, as a rule, the ones with no ability. A lot of
          them are the ones with the most, the ones whose taste ran so far ahead of their skill that the gap felt
          unbearable before the skill got any time to close it. Good taste is not only the thing that makes you good
          later. It is also the thing most likely to talk you out of ever getting there.
        </p>

        <h2>Video makes the gap feel wider than it is</h2>
        <p>
          Short video stacks the deck in a way older crafts never did. You can rewatch your own clip instantly, ten times
          over, freeze it on the worst frame, and study the second you hate. A painter with a bad first canvas did not get
          to do that on a loop. You end up marinating in your own flaws in a way almost no beginner ever could before.
        </p>
        <p>
          Then the comparison finishes the job. The moment after you watch your rough thing, you open the app, and the
          next video in the feed is somebody&apos;s hundredth. It is smooth and sure of itself and looks easy. You set
          your attempt number one against their attempt number one hundred and never once notice the numbers are
          different. Part of the gap you feel is real. Part of it is that you are grading your first drafts against other
          people&apos;s finished work and reading the difference as talent.
        </p>

        <h2>You cannot study your way across it</h2>
        <p>
          When your work disappoints you, the instinct is to go learn. Watch more of the good accounts, break down what
          they do, study the niche until you crack it. It feels like the responsible move, and it is the wrong one,
          because watching is how you built your taste in the first place. More watching sharpens the half of you that is
          already ahead and does nothing for the half that is behind. It widens the gap. You come away knowing more
          precisely why your own stuff is not good, which makes the next video feel worse, not better.
        </p>
        <p>
          The only thing that moves the other half is reps. Finished, posted, imperfect reps, made while the work still is
          not good. That is the part people flinch at, because it means the way across is to keep making things you can
          already tell are not your best, on purpose, before you feel ready. Ira Glass&apos;s own fix was a deadline, one
          finished piece every week, for exactly this reason. Volume is the bridge, and there is not another one.
        </p>
        <p>
          This is not permission to lower your standards. Keep the taste. You will need it, since it is the thing that
          tells you what to fix next. The move is only to stop letting it decide whether you are allowed to keep going.
          Point your eye at the next video, not at the question of whether you belong here. Those are two different jobs,
          and most of the people who quit had them fused into one.
        </p>

        <h2>The wince does not leave</h2>
        <p>
          Here is the part nobody warns you about. The feeling does not go away once you get good. Your taste keeps
          climbing right next to your skill, so the creators you admire still watch their own work and wince. That never
          fully stops. What changes is not the cringe but what you do with it, whether you read it as a verdict on you or
          as the pull that is dragging the work forward. So the goal was never to stop feeling that drop when you watch
          yourself back. It was to keep posting while you feel it.
        </p>
      </Article>
    </>
  );
}
