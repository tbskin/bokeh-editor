import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-called-a-full-room-nothing")!;

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
          You open the app the morning after you post. Two hundred views. Something in your chest drops, and without
          quite deciding to, you file the video under did not work and start turning over what you got wrong.
        </p>
        <p>
          Now picture two hundred people in a room. Rows of chairs, every one of them full, and people standing along
          the back wall. You would not walk out on that room and call the night a failure. You would be nervous to speak
          to it. Same number, completely different feeling, and the gap between those two feelings is quietly ending more
          creators than any algorithm ever has.
        </p>

        <h2>A number is easy to walk away from</h2>
        <p>
          The room and the count feel different for a reason, and it is not that you are bad at math. A number does
          something to the part of you that cares. It turns it down.
        </p>
        <p>
          Researchers have watched this happen for years. In one well-known study, people leaving an experiment were
          given the chance to donate some of their earnings to a hungry child. They gave the most when they were told
          about one girl, Rokia, with a face and a short story. When they were shown Rokia and a second child together,
          they{" "}
          <a href="https://www.sas.upenn.edu/~baron/journal/7303a/jdm7303a.htm" target="_blank" rel="noopener noreferrer">
            gave less than they had given to Rokia alone
          </a>
          . The more the situation turned from a person into a group, a number, the less people felt and the less they
          did. Our care is built for single, real people, and it goes quiet in front of a count.
        </p>
        <p>
          That study usually gets told as a sad fact about charity. It is also a fact about your analytics screen. A view
          total is your audience with the people taken out of it. It is the version that cannot move you, by design. So
          two hundred human beings, each of whom stopped a moving feed and handed you a slice of a day they will never
          get back, reach you as a small gray number you can shrug off before your coffee is cool. The people were real.
          The number is the thing that erased them.
        </p>

        <h2>You are grading it against the wrong room</h2>
        <p>
          There is a second trick stacked on the first. You do not only glance at two hundred and feel little. You
          measure it against a number you carry around, and that number is huge, because you got it from the top of the
          feed.
        </p>
        <p>
          The typical video does far worse than people assume. One set of benchmarks puts the{" "}
          <a href="https://heistbrain.com/benchmarks/tiktok-views.html" target="_blank" rel="noopener noreferrer">
            average TikTok around 18,000 views
          </a>
          , but an average like that is mostly a story told by outliers, a few videos with millions of views hauling the
          mean up while the ordinary post lands in the low thousands or the hundreds. The counts you actually see all day
          are the viral ones, because those are the only ones the feed bothers to put in front of you. So you take your
          real, ordinary, perfectly alive two hundred and hold it up against a highlight reel, and of course it reads as
          nothing. You are comparing a full room to a stadium you only ever see on a screen.
        </p>

        <h2>The number is where the bad decisions come from</h2>
        <p>
          None of this would matter if it stayed a feeling. It matters because you act on it. The count is what you reach
          for when you decide whether the video was any good, whether the idea earned its evening, whether to post again
          tomorrow or just quietly stop. And by the time the count reaches you, the people have already been scrubbed out
          of it.
        </p>
        <p>
          So watch what the numbed version of you does with that bad information. It deletes the post, because two
          hundred is embarrassing. It throws out the whole plan after one night, because clearly that did not work. It
          leaves the next video sitting in drafts for a week, because what is the point. Every one of those is a reaction
          to a small gray number, made by the part of you that cannot feel the room the number stands for. If you had
          watched forty of those people stay all the way to the end, and forty finishers is a normal, quiet,
          unremarkable result, you would be looking at forty humans who chose to hear you out. You would never call that
          nothing to their faces. You call it nothing only because it showed up as a digit.
        </p>

        <h2>Go find one of them</h2>
        <p>
          The fix is not to pretend the numbers are not there, and it is not to chant that every view is a person until
          you believe it. That wears off by lunch. The fix is smaller and more physical than that. Under the count there
          are almost always a few traces of the actual people: a comment, a save, someone new who followed. Read those
          first, before you look at the total. One real sentence from one real person does the thing the number cannot.
          It puts a face back on the audience, and the face is what actually tells you whether the thing landed.
        </p>
        <p>
          The screen keeps nearly convincing you of something that was never true. You were not talking to a number. You
          were talking to people, one at a time, the way you always have been. The count is just the receipt, and it
          happens to be printed in the one language that can make a room full of people feel like no one at all.
        </p>
      </Article>
    </>
  );
}
