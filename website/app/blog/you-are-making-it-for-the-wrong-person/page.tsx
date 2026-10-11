import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-are-making-it-for-the-wrong-person")!;

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
          You post something you actually thought about. You got the nuance right, you did not oversimplify, you fit in
          the caveat the sharp people would want. It goes out and does nothing. Then a week later you say a thing you
          almost cut for being too obvious, and that one travels. It feels backwards, like the audience is punishing you
          for trying harder.
        </p>
        <p>
          It is not backwards, and it is not the audience being slow. You made the first one for the wrong person. When
          you sat down to record, without meaning to, you were picturing someone. And for most people who know their
          subject well, the person they picture is the last person they should be talking to.
        </p>

        <h2>Who is in the room when you hit record</h2>
        <p>
          Watch yourself the next time you make something. There is a quiet judge standing in the room with you. For
          anyone who knows their field, that judge is almost always a peer. Someone who does what you do and would notice
          if you got it wrong, the kind of person who might think less of you for explaining the basics. So you make the
          video to clear that person&apos;s bar. You add the qualifier they would want and skip the plain setup, because
          everyone already knows that part.
        </p>
        <p>
          The pull is not really about the video. It is about wanting to be taken seriously. Saying the obvious thing
          feels like admitting you are not that advanced, and nobody who spent years getting good at something wants to
          look like a beginner doing it. So you aim high to protect how you are seen. The trouble is that the handful of
          people whose respect you are chasing were never going to be your audience, and the enormous group who would
          have followed you cannot follow a video pitched over their heads.
        </p>

        <h2>You cannot hear your own tapping</h2>
        <p>
          There is a reason this is almost impossible to catch by yourself. Once you know something well, you lose the
          ability to remember not knowing it. Psychologists call it the curse of knowledge, and{" "}
          <a
            href="https://mitsloan.mit.edu/ideas-made-to-matter/curse-knowledge-why-experts-struggle-to-explain-their-work"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT Sloan describes how the wiser people get, the worse they become at explaining themselves
          </a>
          , because the steps that used to be hard have gone automatic and dropped out of view.
        </p>
        <p>
          The clearest demonstration of it is old. In 1990 a Stanford researcher had people tap out famous songs on a
          table and predict how many listeners would name the tune. The tappers guessed about half.{" "}
          <a
            href="https://matthiasott.com/notes/100-days-of-writing-001-the-curse-of-knowledge"
            target="_blank"
            rel="noopener noreferrer"
          >
            The real number was 2.5 percent
          </a>
          . In the tapper&apos;s own head the whole song was playing. To the listener it was knocking on a table. That
          gap, between the full song you hear and the tapping everyone else gets, is the same gap between how clear your
          video feels to you and how it actually lands for someone who does not already know the tune.
        </p>

        <h2>The audience is mostly the people you are talking past</h2>
        <p>
          Now think about who is really out there watching. Every subject has a shape to its audience. A small number of
          people know it cold. A somewhat bigger group knows a little. Underneath both sits the largest group by a wide
          margin, the people who are curious and mostly new. That bottom layer is where almost all of your possible
          viewers are, for a plain reason. There is one way to know a thing deeply and a hundred ways to be near the
          start of it.
        </p>
        <p>
          So when you pitch a video at the top of that stack, you are fighting for the thinnest slice of attention there
          is and speaking past everyone else. The basic take that made you wince did well because it met the biggest
          group exactly where they were standing. It was not a worse video. It was a better aimed one.
        </p>
        <p>
          You can hear the difference in a single sentence. A photographer explaining why photos look flat can say it is
          a dynamic range limitation in the sensor, or they can say your phone is trying to keep both the bright window
          and the dark room and it cannot, so it gives up on one of them. Same fact. The first is aimed at someone who
          already knows what dynamic range is, which means it is aimed at almost nobody. The second is aimed at the
          person who actually took the flat photo and wants to stop.
        </p>

        <h2>Make it for the person you used to be</h2>
        <p>
          The fix is uncomfortable and simple. Make it for the person a few steps behind you. Not a total stranger to the
          field, just you from a year or two ago, back when the thing you now find obvious was the thing you were
          straining to work out. Say the part you keep wanting to skip. Define the word. Start one level lower than feels
          dignified.
        </p>
        <p>
          This is not dumbing it down, and that fear is exactly what keeps good people stuck making things nobody
          watches. You can be simple and still be exact. Being clear does not cost you your point of view, and a beginner
          still could not have made the video in your place. Simple is not the same as shallow. What you cut is not the
          substance. It is the throat clearing you added to prove you belonged in the room.
        </p>
        <p>
          And you will know when you have it right, because it will feel slightly wrong. There is a small cringe in
          saying the plain thing without hedging, in picturing your peers watching you explain something they already
          know. That cringe is the signal. It means you finally stopped performing for the people grading you and started
          talking to the one person who actually needed to hear it.
        </p>
      </Article>
    </>
  );
}
