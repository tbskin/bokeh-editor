import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("no-one-was-waiting")!;

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
          You miss a few days. A busy week, or a stretch where you did not want to pick up the phone at all, and the whole
          thing sits untouched. The longer the gap runs the worse it feels, until posting again is less like posting and
          more like walking back into a room you left in the middle of a sentence. So when you finally do post, the video
          opens with an apology. &quot;Sorry I have been gone. Things got busy. I am back now, for real this time.&quot;
        </p>
        <p>
          That apology assumes something. It assumes someone noticed. That there was a room with people in it, waiting for
          you to come back and a little let down that you went quiet. For almost everyone reading this, that room does not
          exist, and believing it does is quietly making the whole thing harder than it has to be.
        </p>

        <h2>The room is mostly strangers</h2>
        <p>
          Picture who actually sees your next video. On Instagram, the format built to reach new people sends most of its
          views to accounts that do not follow you. Around{" "}
          <a href="https://www.loopexdigital.com/blog/instagram-reels-statistics" target="_blank" rel="noopener noreferrer">
            55 percent of Reels views come from non-followers
          </a>
          , more than any other format on the app. On a short-video feed the default viewer is not a regular who came
          looking for you. It is a stranger the app handed your clip to because it guessed they might stay.
        </p>
        <p>
          And the followers you do have are mostly not watching either. A typical post reaches only a few percent of the
          people who once tapped follow,{" "}
          <a
            href="https://www.social.plus/blog/only-3-5-of-followers-see-your-instagram-posts---why-organic-reach-is-no-longer-a-growth-strategy"
            target="_blank"
            rel="noopener noreferrer"
          >
            somewhere around three or four percent
          </a>
          , a little higher if your account is small. The app does not round up your followers and announce your new
          video. It shows the post to a small first batch and waits to see what they do. Most of the people who ever
          followed you will not see the thing you made this week.
        </p>
        <p>
          So the picture in your head, your people refreshing the feed for your next one, is not how any of it runs. The
          next person to watch you most likely does not know you exist yet, and will forget you by the next swipe unless
          the video gives them a reason not to. There is no line waiting at the door. There is a turnstile, and mostly
          strangers coming through it.
        </p>

        <h2>So who is the apology for</h2>
        <p>
          Go back to that comeback video, the one that opens with &quot;sorry I have been gone.&quot; Who is it actually
          for. Not the strangers. They are most of the room, and they were not around last month to miss you, so to them
          the apology is a baffling cold open, a person explaining an absence from a show they never watched. And not your
          followers either, most of whom did not clock the gap, because they did not see the old posts and are not seeing
          this one.
        </p>
        <p>
          So the apology is for the audience in your head. You are reassuring a crowd that was never sitting there, and you
          are doing it with the opening seconds of the video, the exact part that decides whether a real stranger stays.
          You spend your best moment on your own guilt. The fix is almost insultingly simple. Delete the apology and start
          the video. No one is owed an explanation, because no one was holding your seat.
        </p>

        <h2>The guilt was never about them</h2>
        <p>
          None of this means a gap costs nothing. It can. But look at what the guilt is actually built from. It feels like
          you let people down, and that word is the trap, because letting people down is a serious thing, a promise broken,
          and you did not break a promise to a crowd that was never waiting on one.
        </p>
        <p>
          What the gap really cost you is smaller and more mechanical. The app cooled on you a little. You are a few reps
          rustier than you would have been. Both are real and both are fixed by simply posting again. But the story you
          wrap around it, that you failed the people counting on you, turns an ordinary quiet stretch into a moral failure,
          and a moral failure is the kind of thing a person quits over. That is how a surprising number of accounts
          actually end. Not in a decision to stop, but in a gap that got recast as a betrayal, until coming back felt like
          facing people you had wronged, and not coming back felt easier.
        </p>

        <h2>Be consistent for a reason that survives</h2>
        <p>
          So should you stop trying to post regularly. No. Consistency still matters, just not for the reason you were
          sold. It matters because the app forgets accounts that go dark, and because you get better at this by doing it
          often. It does not matter because a fanbase is out there depending on you to keep your word.
        </p>
        <p>
          That is not a small distinction. Consistency built on a promise to a waiting crowd is fragile, because the crowd
          is imagined and guilt burns off fast, so the first real gap reads as proof you failed and hands you a reason to
          leave. Consistency built on the plain fact that every post is a cheap new try in front of new people holds up,
          because there is no one to betray and no streak to protect, only another go tomorrow. One of those survives a bad
          month. The other quietly does not.
        </p>
        <p>
          Which turns the comeback video inside out. There was no comeback, because you were never gone from a room full of
          people. You were doing something quieter than that the whole time, dropping things into a feed that meets you as
          a stranger most of the time, and getting one more try, every single day, at being worth remembering. You do not
          owe that feed an apology for the days you missed. You owe it the next thing you make.
        </p>
      </Article>
    </>
  );
}
