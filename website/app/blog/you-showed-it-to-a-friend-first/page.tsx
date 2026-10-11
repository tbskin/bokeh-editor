import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-showed-it-to-a-friend-first")!;

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
          You finish the video. Before it goes anywhere, you send it to one person. A friend, your partner, the group
          chat. &quot;Is this good? Be honest.&quot; Then you watch the typing bubble more closely than you will ever
          watch a view count, because whatever comes back is going to decide whether you post it.
        </p>
        <p>
          That habit feels like the responsible move, the grown-up version of not just flinging things into the world.
          It is also one of the quietest ways a good video ends up staying in your drafts.
        </p>

        <h2>The one person who cannot answer the real question</h2>
        <p>
          The question that actually matters about your video is narrow. Would a stranger, mid-scroll, with no reason to
          care about you, stop and stay. That is the only thing being tested when it goes out. And the person you asked
          is the one human on earth who cannot tell you, because they did not meet the video cold. They met it as your
          friend. They already like you, and they can hear your voice under the words and fill in the backstory you cut
          out. They are watching a different video than the strangers will.
        </p>
        <p>
          Then the softer problem, the one nobody says out loud. Most people who care about you are not going to risk
          the friendship over your Reel. There is a name for the pull toward the agreeable answer, and researchers who
          study feedback have found that people{" "}
          <a
            href="https://www.apa.org/pubs/journals/releases/psp-pspi0000393.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            hold back honest criticism far more than the other person wants
          </a>
          , because they overrate how much it will hurt to say it. So you get one of two useless replies. A warm
          &quot;haha that&apos;s so good, post it&quot; that tells you nothing, or a safe note about the lighting that
          sends you back to re-edit the one thing that was never the problem. Either way you learned nothing about the
          only question that counted, and you walk away feeling like you did your homework.
        </p>

        <h2>The honest friend is the worse case</h2>
        <p>
          Say you have the rare friend who does tell you the truth. Now it is worse, not better, because you just handed
          the yes-or-no on your work to a member of the exact audience you are most afraid of. The stranger who scrolls
          past costs you nothing. The person who will be across the table from you on Saturday costs you everything. A
          flat &quot;yeah, it&apos;s fine I guess&quot; from your brother lands with a weight that a thousand
          indifferent strangers could never match, and it is more than enough to talk you out of posting.
        </p>
        <p>
          So the video dies, and it dies for the one viewer it was never made for. You built something for the people
          who do not know you yet, and then you let a person who does decide whether it lives. The audience that scares
          you most, the people close enough to have an opinion that stings, is the audience you accidentally put in
          charge.
        </p>

        <h2>Even a rave costs you something</h2>
        <p>
          Here is the part that caught me off guard. Showing it first can set you back even when the reaction is great.
          When you tell someone about the thing you made and they light up, &quot;oh, you have to post that,&quot; you
          collect a small piece of the exact reward you were supposed to earn by posting it. Being the person who makes
          cool videos feels, for a second, already true.
        </p>
        <p>
          Psychologists have watched this happen. In a set of studies on people chasing goals tied to their sense of
          who they are, the ones who told others about the goal then{" "}
          <a
            href="https://sloanreview.mit.edu/article/announcing-plans-may-kill-motivation-productivity/"
            target="_blank"
            rel="noopener noreferrer"
          >
            worked less hard at it
          </a>{" "}
          than the ones who kept it to themselves, because the recognition gave them a premature sense of completeness.
          The applause for describing the thing quietly pays out part of the applause you were going to chase by
          finishing it. Which is why the video you were most excited to show one person is so often the one that never
          actually goes out. You already got the good part.
        </p>

        <h2>The feedback that actually tells you anything</h2>
        <p>
          None of this means make things in a sealed room and listen to no one. It means being honest about which
          feedback can tell you something. The feedback worth having shows up after you post, from the people the video
          was actually for, and it does not arrive as words. It arrives as whether they watched to the end, whether they
          saved it, whether they sent it to someone. Those are people with no reason to be nice to you, answering the
          only real question with their behavior instead of their manners. That is the review. A text from someone who
          loves you, sent before anyone has seen it, is not.
        </p>
        <p>
          There is one narrow reason to show a person your video before it goes out, and it is not to ask whether it is
          good. It is for the moment when you have watched your own cut so many times you cannot see it anymore, and you
          want a fresh pair of eyes for ten seconds to catch the part that stopped making sense. That is borrowing
          someone&apos;s attention to reset your own. It is not the same as handing them the verdict. The tell is which
          question you are really asking. &quot;Does this still make sense&quot; is fine. &quot;Am I allowed to post
          this&quot; is the one that keeps you small.
        </p>
        <p>
          The one test that has ever told you the truth about your videos is the test you keep dodging by asking someone
          first. You mostly know what the honest answer would be. It is only that the person holding it has never met
          you.
        </p>
      </Article>
    </>
  );
}
