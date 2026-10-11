import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("someone-already-has-your-audience")!;

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
          Ask a creator how to grow and they will tell you about the algorithm. The hook, the posting time, the sound
          that is moving this week, the trick that gets the feed to carry you out to strangers. Almost nobody mentions
          the other way in, the one that has always worked and does not run through the feed at all. Someone else already
          has the exact people you are trying to reach, and they can hand a few of them to you.
        </p>
        <p>
          The whole thing gets framed as you against the algorithm, a solo climb where every viewer has to be won cold.
          But a stranger mid scroll is the hardest person you will ever try to convince. They have never heard of you,
          and their thumb is already moving. You are spending your best hours on the coldest audience there is.
        </p>

        <h2>A borrowed introduction does what the feed cannot</h2>
        <p>
          When someone lands on you because a creator they already follow pointed their way, they arrive carrying
          something the feed can never attach to a video. A reason to trust you before you have done a thing to earn it.
          That trust is not yours yet. It is on loan from the person who sent them, and it works anyway.
        </p>
        <p>
          Nielsen has asked people the same question for years and the answer barely moves. A recommendation from someone
          they know beats every other kind of advertising they run into. In one global study,{" "}
          <a
            href="https://www.nielsen.com/insights/2012/global-trust-in-advertising-and-brand-messages-2/"
            target="_blank"
            rel="noopener noreferrer"
          >
            92 percent
          </a>{" "}
          said as much. A shoutout, then, is not really a stack of extra views. It moves trust from a person who has it
          to a person who has not built it yet, and trust is the part that takes a beginner the longest to earn on their
          own.
        </p>
        <p>
          Which is why a hundred people who show up because someone vouched for you can be worth more than ten thousand
          who tripped over you in the feed. The cold ones watch for a second and forget. The warm ones arrive already
          tilted toward liking you, because the introduction did the job your video normally has to do from a standing
          start.
        </p>

        <h2>You think you are too small to ask</h2>
        <p>
          This is where most people stop before they start. Collaboration sounds like something you earn later, a favor
          you go asking for from someone bigger, and reaching out feels like turning up with your hand out. So you decide
          to wait until you are large enough to deserve it, and that day keeps not coming.
        </p>
        <p>
          The picture is wrong in a way that costs years. The creators most likely to work with you are not the giant
          accounts. They are the ones roughly your size, in your corner of things, a step ahead of you or a step behind.
          To them you are not a beggar. You are a trade. Their people meet you and your people meet them, and both of you
          end up with a door where there used to be a wall. Two accounts the same size can hand each other a whole new
          room in an afternoon, and neither one had to be famous first.
        </p>
        <p>
          And you bring more to that trade than you think, even now. The other creator does not just get a look at your
          followers. They get a second voice that keeps a video from being one more monologue, and a take on the subject
          they would not have reached for by themselves. Size is the thing you are short on. The rest of what makes a
          collaboration good, you already have.
        </p>

        <h2>Pick the overlap, not the biggest name</h2>
        <p>
          When people do try this, they reach for the largest account that will have them, and that is the wrong pull. A
          huge shoutout from someone whose audience has nothing to do with your thing brings a wave of the wrong people,
          the ones who glance once and never return, and you already know from your own flops how little a wrong crowd is
          worth. What you want is overlap. A smaller creator whose viewers would actually want what you make sends you
          fewer people who are far more likely to stay.
        </p>
        <p>
          So the question is less about who has the most followers and more about whose audience would look at your stuff
          and feel like they had found more of something they already liked. Match the room to what you make, and a small
          introduction beats a big mismatched one.
        </p>

        <h2>It rarely looks like a formal collab</h2>
        <p>
          Borrowing an audience almost never looks like a scheduled project with a plan and a call. It is any moment your
          name lands next to someone else&apos;s in front of their people. Sometimes that is a real reply under a bigger
          creator&apos;s video that a few hundred of their followers actually read. Sometimes it is a stitch that adds the
          part they left out, or making the exact thing a creator&apos;s challenge asked for on the day they asked it,
          while their whole audience is already gathered and looking. Sometimes it is two of you filming one conversation
          and each posting your own half.
        </p>
        <p>
          None of that needs a pitch email or anyone&apos;s permission. It needs you to stop treating the other creators
          in your lane as rivals for the same slice of feed and start treating them as the way into rooms you cannot
          reach on your own.
        </p>

        <h2>Alone only feels safer</h2>
        <p>
          The reason this stays rare is not that it is hard. It is that doing it by yourself feels safer. You keep full
          control, you owe nobody anything, and when a post flops it flops in private. Reaching out means a person you
          admire might read your message and say nothing back, and that quiet no stings in a way a bad video never does.
        </p>
        <p>
          But the solo climb you are protecting is the slow one. You can spend a year teaching the feed who you are one
          cold stranger at a time, or you can borrow a room that took someone else a year to fill. The people you are
          trying to reach are not scattered out in the dark waiting to be found. They are already sitting in someone
          else&apos;s audience. You just have to go stand next to whoever gathered them.
        </p>
      </Article>
    </>
  );
}
