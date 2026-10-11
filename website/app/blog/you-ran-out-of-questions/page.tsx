import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-ran-out-of-questions")!;

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
          You sit down to make something and the note stays empty. Not because you are tired, and not because you are
          busy. You have the time tonight. You even want to post. You just do not have anything to say. So you scroll your
          own feed looking for a spark, open the trending sounds, read a couple of your old captions, and twenty minutes
          later you close the app and tell yourself the thing everyone tells themselves. I have run out of ideas.
        </p>
        <p>
          Those are the wrong words for it. You did not run out of ideas. You ran out of questions. That is a different
          problem with a different fix, which is why the drought feels so permanent and so personal when it is neither.
        </p>
        <p>
          It is not a rare private failure, either. The grind of always needing the next thing is one of the main reasons
          people walk away. In one survey of creators, about half named the constant pressure to keep coming up with new
          ideas as a top cause of burnout, and nine in ten said they had{" "}
          <a
            href="https://www.ion.co/90-percent-of-content-creators-report-experiencing-burnout-vibely"
            target="_blank"
            rel="noopener noreferrer"
          >
            burned out at some point
          </a>
          . So if the empty note has been ending your runs, you are in a large and quiet crowd. The usual advice for it
          is to brainstorm harder, chase a trend, or buy a pack of a hundred hooks. All of that treats the drought as a
          shortage of tricks. It is almost always a shortage of something else.
        </p>

        <h2>An idea is a gap you can feel</h2>
        <p>
          The psychologist George Loewenstein described curiosity as the feeling of a{" "}
          <a href="https://psychologyfanatic.com/information-gap-theory/" target="_blank" rel="noopener noreferrer">
            gap between what you know and what you want to know
          </a>
          . You get pulled toward the specific thing sitting just past the edge of what you already understand. Read that
          closely and it tells you something about the empty note. No gap, no pull. When there is nothing between what you
          know and what you want to know, there is nothing to be curious about.
        </p>
        <p>
          An idea, when you actually have one, is what that gap feels like from the inside. It is the thing you half
          understand and want to work out, the question you cannot quite drop. That is why ideas come in a flood when you
          first start something. Everything is a gap. You are learning the whole subject at once, and every new corner of
          it is a video you want to make. It feels like being unusually creative. It is mostly just being new.
        </p>

        <h2>The safe move is the one that dried you up</h2>
        <p>
          Then the ordinary thing happens. You get good. You settle into the part of your subject you understand best and
          you build there, on the ground you know cold, because that feels like the responsible move. You are supposed to
          be the one who knows. Teach what you have learned. Stop posting things you are unsure about. So you spend down
          what you have already worked out.
        </p>
        <p>
          And what you have already worked out is a fixed amount. You can only explain a thing you fully understand so
          many ways before you have said it. The gaps are shut. There is no pull left, because there is nothing past your
          edge that you have not already crossed. Notice that this is the exact feeling you started the night with. You
          are not blocked and you are not tired. You feel like you have said everything. You have. You said everything
          about the part you had already finished.
        </p>
        <p>
          This is the quiet cost of the advice to pick what you know and stay in your lane. Mastery is a bucket. You pour
          out what is in it, honestly and usefully, and then one Tuesday you reach in and it is empty, and you mistake the
          empty bucket for a broken you.
        </p>

        <h2>The part you are still figuring out</h2>
        <p>
          The people who never seem to run dry are not more imaginative than you are. Watch what they actually do and it
          is almost dull. They are still in it. Still making the thing they post about, still stuck on some problem they
          have not solved. The photographer is fighting with a kind of light they are bad at. The cook is failing at a
          cuisine they did not grow up in. Each of those is a fresh gap, and a gap is an idea, so they rarely get the
          empty-note night. They keep walking back into the one condition that makes ideas in the first place.
        </p>
        <p>
          &quot;Learning in public&quot; gets sold as a strategy, with a system and a schedule attached. It is simpler
          than that. Learning in public is just what having ideas looks like from the outside. The questions you are
          working through are the most interesting thing you own, and they are interesting to a stranger for the same
          reason they are interesting to you. The answer is not settled yet.
        </p>
        <p>
          The fear here is that people follow experts, and that admitting you are still working something out costs you
          the authority. It costs less than you think. The person watching is not checking your credentials. They are
          deciding whether you are worth a minute of their evening, and someone a real step ahead of them, visibly chewing
          on a live question, holds that minute better than someone reciting finished facts in a flat voice. You do not
          have to perform a confusion you do not feel. You only have to stop hiding the part of your subject you are still
          curious about, which was the good part the whole time.
        </p>

        <h2>Go get curious again</h2>
        <p>
          So the cure for the empty note is not a better brainstorm. It is to go be curious about your own subject again.
          Take the class in the corner of it you have been avoiding. Ask out loud the question you have been quietly
          pretending you already know the answer to. The ideas come back the minute you do not know something again,
          because that is the only place they were ever coming from.
        </p>
        <p>
          Which means the drought was never proof that you had nothing left to say. It was proof that you had stopped
          learning your subject and started only teaching it. The day you stop being curious about the thing is the day
          it stops handing you things to say, and you will feel that as running out of ideas. It is closer to running out
          of questions. And questions, unlike answers, are a supply you can always go make more of.
        </p>
      </Article>
    </>
  );
}
