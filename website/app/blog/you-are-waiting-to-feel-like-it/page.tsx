import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-are-waiting-to-feel-like-it")!;

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
          You meant to post this week. It is Thursday now, and the pull to sit down and make something has not shown up
          once, so you have quietly filed today under later. Most days end up filed there. You are not blocked, and you
          have not run out of things to say. You just do not feel like it, and you are waiting until you do.
        </p>
        <p>
          That wait is the whole problem, and not for the reason it looks like. You are treating the missing feeling as
          information, as an honest little signal that the timing is off or the spark has gone. It is not a signal. It is
          the ordinary state of not having started yet, and it was not going to lift on its own while you sat there
          waiting for it.
        </p>

        <h2>The feeling is not telling you anything</h2>
        <p>
          What you are waiting for is some pull toward the thing, the sense that you have something worth making. When it
          does not come, you read the absence as meaningful, as your own honest verdict that today is not the day. But
          that feeling was never a readout on whether the video is good or whether you still care. It mostly tracks one
          thing, whether you have started, and from the couch, deciding in advance whether you feel like filming, you
          will almost always land on no. You are weighing a warm known evening against an unstarted thing that has given
          you nothing back yet. Of course the couch wins.
        </p>
        <p>
          The absence of the urge is not a message about the work. It is just what not having begun feels like, for
          almost everyone, on almost every day. Reading it as a verdict is like reading an empty plate as proof you were
          never hungry.
        </p>

        <h2>It runs in the other order</h2>
        <p>
          Underneath the wait is a belief about the order things come in. Motivation first, then action. You feel the
          pull, and the pull is what moves you to make the thing. For creative work this feels obviously true, because
          the good stuff seems to arrive on a wave of inspiration and the flat days seem to prove there is nothing there
          yet. But the order is usually backwards, and you can see it most clearly in the people whose whole problem is
          that they cannot make themselves do anything. The treatment for depression with one of the strongest track
          records, behavioral activation, is built on a plain and slightly rude finding:{" "}
          <a
            href="https://animosanopsychiatry.com/blog/behavioral-activation-for-depression-why-action-comes-before-motivation"
            target="_blank"
            rel="noopener noreferrer"
          >
            action comes before motivation
          </a>
          , not after. You do the thing first, without the feeling, and the wanting shows up during, dragged along by
          having started. Waiting for the motivation to arrive first is the one move that reliably keeps it from arriving
          at all.
        </p>
        <p>
          You have felt this and probably did not clock it. The hardest part of making almost anything is the sixty
          seconds before you begin. Once you are two minutes in, framing a shot or writing the first line, the resistance
          you were sure meant something has quietly evaporated and you are just working. The feeling you were waiting for
          did turn up. It turned up after you started, which is the whole trick, because if you require it as the toll
          for starting, you have put the gate in the one spot the feeling never stands.
        </p>
        <p>
          There is a decent measure of where that drive actually comes from. Teresa Amabile and Steven Kramer collected{" "}
          <a href="https://progressprinciple.com/progress-principle/" target="_blank" rel="noopener noreferrer">
            close to 12,000 daily diary entries from 238 people
          </a>{" "}
          and went looking for what most lifted a person&apos;s motivation on a given working day. It was not praise, and
          it was not a reward. The biggest lever by a distance was making progress on something that mattered, even a
          small step of it. The wanting is something the work pays out once you are in it. It is not a ticket you need in
          hand before you are allowed to begin.
        </p>

        <h2>The waiting is what drains it</h2>
        <p>
          This is why a quiet stretch feeds on itself. The pull to make something tracks how recently you last made
          something. Post today and tomorrow is easier, the muscle still warm, the last little bit of progress still
          paying out. Leave it a week and the pull is fainter. Leave it a month and it is gone, and by then you have a
          story ready for it. I have lost my passion. Maybe it was a phase. Almost always the truth is smaller and much
          better news than that. You stopped, and stopping is the thing that took the feeling with it. The passion did
          not leave and then you stopped. You stopped, and then it left.
        </p>
        <p>
          None of this depends on anyone watching. Even a video that does nothing tops up the wanting in a way a view
          count never does, which is why the people who keep making things almost no one sees still want to make the next
          one, and the people waiting for the right time to come back so rarely feel the right time show up. The creators
          who look tireless are not sitting on some deeper reserve of passion than you have. They just never let the gap
          get wide enough to drain, so the feeling is at least warm every time they sit down. What reads as discipline
          from the outside is mostly never having gone cold.
        </p>

        <h2>Start before you mean it</h2>
        <p>
          So the fix is almost insultingly simple, and it is the only order that has ever worked. Make something today
          before you feel like it. Not something good. Set the bar at bad and finished, one clip and one plain sentence,
          low enough that not feeling like it stops being a real excuse, because the thing is too small to need a mood.
          That video is not the point. The point is that starting is the only known way to produce the state you have
          been waiting to be handed, and once you have it, you can go make the real one.
        </p>
        <p>
          Waiting to feel like it is just the last precondition, the one that comes after{" "}
          <Link href="/blog/you-were-one-purchase-away-from-starting">the gear</Link> and{" "}
          <Link href="/blog/you-are-waiting-to-be-qualified">the qualifications</Link>, and it is the sneakiest of the
          three because it is invisible and it feels like respect for the craft. Serious people wait for the muse. But
          the muse, as far as anyone has ever managed to measure it, does not knock first. It turns up a few minutes
          after you started without it, and only ever for the people who were willing to begin bored.
        </p>
      </Article>
    </>
  );
}
