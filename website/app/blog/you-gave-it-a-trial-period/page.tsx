import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-gave-it-a-trial-period")!;

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
          You did not decide to become someone who posts. You decided to try it. Give it a month, see if it goes
          anywhere, and if it does not, you can walk away without having lost much. That felt like the smart, low
          pressure way to start, and it is the most common advice there is. It is also, quietly, the reason it fell
          apart.
        </p>
        <p>
          A trial has an exit built into it. You told yourself the whole thing was provisional, up for review, and once
          something is provisional every post has to earn its keep. So a video is never only a video. It is evidence in
          an open case about whether this is for you and whether the experiment is working, and that is a heavy thing to
          hang on a clip you filmed on a Tuesday. The natural response to that weight is to not post, because not posting
          is the one move that cannot produce bad evidence.
        </p>

        <h2>A test is a thing you can fail</h2>
        <p>
          When you frame posting as an experiment, you also appoint a judge and set a verdict date without noticing you
          did either. Somewhere in your head there is a review coming, a moment when you look at the numbers and decide
          whether you are actually any good at this. Everything before that date is an audition for a part you have not
          agreed to take.
        </p>
        <p>
          An audition is fragile in a particular way. A bad one does not just go badly, it seems to say something about
          whether you belong, so a flop stops being one flop and turns into a point in the case against you. Three quiet
          videos in a row and the verdict writes itself. It does not feel like quitting, it feels like the experiment
          simply reaching its conclusion.
        </p>
        <p>
          The trap is that this framing almost guarantees the verdict comes back bad, because the early evidence is bad
          by design. The first months are the worst your work will ever be and the smallest your audience will ever be,
          so any honest look at the early returns says stop. You built a test that the beginning of anything worth doing
          would fail.
        </p>
        <p>
          You can hear the trial in how you talk about it. You say you are seeing if it takes off, that you will give it
          through the summer, that you do not want to make a big thing of it in case it goes nowhere. All of that sounds
          humble and reasonable, and all of it is you keeping one hand on the exit, which is a hand you are not using to
          make the next video.
        </p>

        <h2>The people who last skipped the trial</h2>
        <p>
          Watch someone who has posted for years and the thing that stands out is not their discipline. It is that the
          question you are still asking, whether this is for you, is not one they have. They are a person who posts. It
          is not a bet they are running, it is a thing they are, so a video that flops is a bad day at a job they already
          hold and not a ruling on whether they should have the job at all.
        </p>
        <p>
          They did not earn that certainty by succeeding first. Most of them decided it early, before the work was any
          good and before there was real proof they were right to. From the outside that looks like arrogance, and it
          works more like a trick. If you are already a person who posts, a flop cannot mean you are not cut out for
          this, because you settled that before you started counting, so the flop shrinks back to what it actually is, a
          video that did not land, and you go make another one.
        </p>

        <h2>One word changes what you do</h2>
        <p>
          This sounds like a game you play on yourself, and it partly is, but the framing genuinely moves behavior.
          Before two real elections, researchers asked people about the vote in one of two ways. One group got questions
          about &quot;voting,&quot; the plain verb. The other got the same questions about &quot;being a voter,&quot; the
          act worded as a kind of person. That single change, a noun instead of a verb,{" "}
          <a href="https://www.pnas.org/doi/10.1073/pnas.1103343108" target="_blank" rel="noopener noreferrer">
            raised turnout by almost 11 points
          </a>
          . Same people, same election, nothing different except whether the act was framed as something you do or
          something you are.
        </p>
        <p>
          The reason is not motivation in the pep talk sense. A behavior is optional and an identity is not. Skipping
          something you merely do is an easy call that costs nothing about who you are. Skipping something you are costs
          more, because for a moment it makes you not yourself, and people work harder than you would guess to avoid
          that. The trial framing files posting under the first kind, forever optional, forever up for renegotiation the
          minute it gets hard.
        </p>

        <h2>Decide it before you have earned it</h2>
        <p>
          So the fix is not to try harder inside the experiment. It is to end the experiment and decide, now, the thing
          it was meant to eventually tell you. You are a person who makes videos. It is unearned, and it feels a little
          fake to say out loud, and that is fine, because the alternative is waiting on a verdict the early months were
          never going to return in your favor.
        </p>
        <p>
          What changes after that is small and matters more than it should. A post stops being a test you might fail and
          becomes the ordinary thing you do, one more entry in a record you are already keeping. You also start reading
          your own behavior as proof instead of the other way around. You posted, so you are someone who posts, so you
          post again, and after enough of that the identity you took on credit turns out to be one you actually own.
        </p>
        <p>
          The trial felt safe because it left the door open. But an open door is not shelter, it is the way out kept in
          view, and knowing it is there is most of what makes you reach for it on a bad week. Shut it. Decide you are
          already the thing, and let posting get boring. Boring is what is still standing the month the experiment would
          have ended.
        </p>
      </Article>
    </>
  );
}
