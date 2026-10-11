import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("your-next-video-is-in-your-comments")!;

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
          You keep a running list somewhere. A note on your phone, a doc, a folder in your head, all labeled some version
          of video ideas. Most days it feels empty. So you open the app to get unstuck, watch what is doing numbers this
          week, and close it twenty minutes later with nothing you actually want to make, just a vague sense that everyone
          else has more to say than you do.
        </p>
        <p>
          The ideas are not missing. You are looking for them in the wrong place. The last ten videos you posted already
          hold your next ten, and they are sitting under each one, in the part you skim for a hit of approval and then
          scroll past. The people who left a comment were not only clapping. A lot of them were telling you exactly what
          to make.
        </p>

        <h2>A comment is a vote you can read</h2>
        <p>
          Consider the person who stops to type a question under your video. They are rare. Across most places online,
          about one percent of people ever create anything, another nine percent react or reply, and the other ninety
          just watch and leave without a trace. That split{" "}
          <a href="https://www.nngroup.com/articles/participation-inequality/" target="_blank" rel="noopener noreferrer">
            has held for years and across very different platforms
          </a>
          , which is why the loud part of any feed is a tiny slice of the people actually there.
        </p>
        <p>
          Run that against your own comments and it changes what a question is worth. The one person who typed does not
          count as one curious person. They stand in for the dozens who felt the same small itch and never moved their
          thumbs. So a question is never a single request. It is the visible tip of a much larger group who wanted the
          same answer and stayed quiet.
        </p>
        <p>
          And it hands you the one thing you can almost never get up front. The scariest guess in making anything is
          whether a single person out there actually wants it. Most ideas die on that guess. A question in your comments
          has already settled it. Someone wanted this enough to ask out loud, which means the quiet crowd standing behind
          them probably wanted it too.
        </p>

        <h2>You are grinding for strangers while your people wait</h2>
        <p>
          Ask creators what their hardest problem is and the top answer, by a wide margin, is{" "}
          <a href="https://www.podia.com/articles/creator-survey-results" target="_blank" rel="noopener noreferrer">
            growing an audience
          </a>
          . Fair. But look at how most people try to solve it. They study trends, which is really studying the questions
          of strangers who have never heard of them, and then make something for a crowd that is not looking their way.
        </p>
        <p>
          Meanwhile the small audience you already have is the one that comes back and sends your stuff to a friend, which
          is where growth actually comes from. When you make the video someone asked for, two useful things happen at
          once. You aim it at a real person with a real problem instead of a fuzzy topic, which almost always makes a
          sharper video. And you show that person you were listening, which is most of what turns a passing viewer into
          someone who stays.
        </p>
        <p>
          Answering your own audience is not the smaller move next to chasing reach. It is the same job done from the
          other end.
        </p>

        <h2>Pick the question that bores you</h2>
        <p>
          Once you start reading comments as briefs, the pull is to grab the flattering one, the sharp question that makes
          you look like you are working at a high level. Skip it. The most valuable question in your comments is usually
          the one you are a little tired of, the thing you assume everyone already knows.
        </p>
        <p>
          When you know a subject well, you lose the ability to feel what is obvious to someone who does not. The question
          that reads as too basic to bother with is almost always the one the largest silent group has, because the people
          asking it are beginners, and beginners outnumber the peers you are quietly performing for many times over. The
          comment that makes you think do people really not know this is a gift. They really do not, and nobody who does
          know it is bothering to say it plainly, which is exactly the opening.
        </p>

        <h2>This is not taking orders</h2>
        <p>
          There is a real objection here, so let me take it seriously. Reading your comments for ideas can slide into
          letting a loud handful run your channel, chasing whatever the last person demanded, and slowly turning into a
          help desk for your pushiest followers. That is a bad way to make things, and it is a real risk.
        </p>
        <p>
          The line is simple. Let your audience pick the what. Keep the how and the point of view for yourself. A question
          tells you a subject people want covered. It does not tell you your take on it, your angle, the reason it is
          worth hearing from you and not a search result, and that part is never up for a vote. Draw from the comments
          like a well. Do not let them become a leash.
        </p>
        <p>
          So the next time you sit down to figure out what to post and feel the blank page starting to win, do not open
          the trends tab. Open your own comments and read them like someone handed you a stack of requests, because that
          is what they are. The idea you have been hunting for is already in there, and unlike anything you would have
          squeezed out of a blank page, it comes with a name attached and at least one person, probably a whole quiet room
          behind them, already waiting for it.
        </p>
      </Article>
    </>
  );
}
