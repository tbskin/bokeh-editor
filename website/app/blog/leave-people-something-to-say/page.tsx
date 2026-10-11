import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("leave-people-something-to-say")!;

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
          You post the video you were surest of. It is clear and complete, it answers the question all the way down, and
          it lands with a few likes, a save or two, and almost no comments. A week later you throw up something
          half-formed, a thought you never quite finished, and the replies fill with people correcting you, arguing,
          adding the part you left out. The careful one sat still. The sloppy one traveled.
        </p>
        <p>
          The easy read is that the second one got lucky. It did not. The careful video did exactly what you built it to
          do, and that was the problem. You closed every loop and left the viewer nothing to add. A video that answers
          everything is a video nobody needs to talk about.
        </p>

        <h2>A complete video gives people nothing to do</h2>
        <p>
          When you make something, the instinct is to make it whole. Say the thing, back it up, tie it off. That instinct
          is right for an essay and wrong for a short video, because a short video does not live on how satisfying it is
          to watch. It lives on what people do once it ends. And a person who agrees with you completely has nothing to
          type. Agreement is quiet. The one comment a fully resolved video reliably earns is &quot;well said,&quot; which
          is the polite version of silence.
        </p>
        <p>
          You have probably left that exact non-comment a hundred times. A video makes its point cleanly, you think yeah,
          that is right, and you keep scrolling. Nothing to say, because there was no seam to grab. Now notice that the
          silence costs more than it used to. Comments are close to the whole engine of reach now. On Instagram, an
          account whose followers reliably comment gets more reach on every new post than one whose followers just scroll
          past, and the platform weighs{" "}
          <a href="https://later.com/blog/how-instagram-algorithm-works/" target="_blank" rel="noopener noreferrer">
            how deep the conversation goes, not only how many comments show up
          </a>
          . A busy comment section is hard to fake, so the platform reads it as proof that people cared enough to stop.
          The video that starts an argument does not only feel better. It gets carried further, to more people, for
          longer.
        </p>

        <h2>You get comments by leaving a gap</h2>
        <p>
          Here is where most advice has it backwards. To get comments, you do not add anything. You take an answer out.
        </p>
        <p>
          A video that says &quot;this is the best way to do it&quot; invites a nod. A video that says &quot;I keep going
          back and forth between two ways and I still cannot decide&quot; invites a fight, because now there are two doors
          and the viewer wants to walk you through the right one. People comment to close a loop you left open. It is the
          same reason an unfinished task nags at you all afternoon while the ones you finished drop out of your head, the
          thing psychologists named the Zeigarnik effect a century ago. Leave a loop open and a lot of people cannot help
          reaching for it.
        </p>
        <p>
          This is not a case for being vague or coy. Coy is irritating, and people can tell when you are hiding the ball
          for effect. The gap has to be real. End on a question you genuinely find hard. Leave out the obvious example you
          know half the room is already thinking of. Or just say the mildly unpopular thing and mean it, the real opinion
          you usually soften before it leaves your mouth. The softened version reads as reasonable and earns a like. The
          honest version reads as something a person has to answer. You are not tricking anyone into talking. You are
          refusing to do all of their thinking for them.
        </p>

        <h2>Comment below does almost nothing</h2>
        <p>
          Now the move everyone reaches for instead, which is to ask. &quot;Comment below.&quot; &quot;Let me know what
          you think.&quot; The plain request does close to nothing on its own, because it hands the viewer a chore and no
          reason to do it. Nobody types a comment to finish your homework.
        </p>
        <p>
          People comment when something in them needs out. They disagree and cannot let it stand. They know a shortcut you
          missed. You described a thing that happened to them last week and now they have to tell you about it. The
          instruction was never the trigger, the gap was. If you want a better prompt than &quot;comment below,&quot; ask
          one narrow question that only some people can answer from their own life. &quot;What is the one clip you could
          never bring yourself to cut&quot; pulls more than any generic ask, because it points at a real thing the viewer
          already has an answer to and just needs an excuse to say.
        </p>

        <h2>The comment section is the second half</h2>
        <p>
          Say it works and the comments come in. The last mistake is to treat that as the finish line. The comment section
          is the second half of the video, and you can play it instead of watching it go by.
        </p>
        <p>
          Replying to your own comments, especially in the first hour, measurably lifts how far a post travels. Buffer
          looked across platforms and found that posts where the creator replied{" "}
          <a
            href="https://buffer.com/resources/replying-to-comments-boosts-engagement/"
            target="_blank"
            rel="noopener noreferrer"
          >
            performed better almost every time, with lifts running from about 5 to 42 percent
          </a>
          . A reply does two jobs at once. It tells the platform the conversation is alive and worth pushing, and it tells
          the next person who lands there that the room has someone in it. A creator answering in the replies is the
          difference between a comment section and a graveyard.
        </p>
        <p>
          So the whole loop is small, and it is not much extra work. Leave a real gap. Let people fill it. Then get in
          there with them while it is still warm. None of that is bolted onto the video. It is the part of the video that
          actually moves it.
        </p>

        <h2>Leave the last inch for them</h2>
        <p>
          The habit worth breaking is the one that feels the most like craft. The urge to answer everything, seal it up,
          hand the viewer a neat little package with a bow on it. That package is exactly what gets scrolled past, admired
          for half a second and forgotten. The videos that travel feel a little unfinished on purpose. They leave you
          wanting to grab the person by the arm and tell them they missed something.
        </p>
        <p>
          Give people that. Make the point, do it well, and then stop one step early. Leave the last inch for them to
          close.
        </p>
      </Article>
    </>
  );
}
