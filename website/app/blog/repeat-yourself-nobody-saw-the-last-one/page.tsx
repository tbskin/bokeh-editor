import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("repeat-yourself-nobody-saw-the-last-one")!;

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
          You are about to post something and you stop. You have made a version of this before. You can feel the shape of
          it, the same point you made a month ago, and it feels lazy to say it again, like the whole audience will notice
          you are out of material. So you set it aside and reach for something newer and thinner. That instinct feels like
          the responsible one. It is quietly one of the most expensive habits a creator has.
        </p>
        <p>
          What it gets wrong is simple, and once you see it you cannot unsee it. Almost nobody saw the last one.
        </p>

        <h2>Almost nobody saw the last one</h2>
        <p>
          Look at what a single post actually reaches. On Instagram, the average post now lands in front of about{" "}
          <a
            href="https://www.social.plus/blog/only-3-5-of-followers-see-your-instagram-posts---why-organic-reach-is-no-longer-a-growth-strategy"
            target="_blank"
            rel="noopener noreferrer"
          >
            3.5 percent of your followers
          </a>
          . Not thirty-five. Three and a half. The number you built in your head, where everyone who follows you sees
          everything you make, has not been true for years. Most of the people who follow you missed the thing you are
          afraid of repeating. They were asleep, or looking at something else, or the feed simply never showed it to them.
        </p>
        <p>
          Then add the churn. Your audience is not a room full of the same faces watching you night after night. People
          drift in and out, and a big share of every video goes to strangers who do not follow you at all. On Instagram,{" "}
          <a
            href="https://www.outfame.com/blog/instagram-reels-statistics"
            target="_blank"
            rel="noopener noreferrer"
          >
            about 55 percent of Reel views come from people who do not follow the account
          </a>
          . So the moment you post, most of the room is either people who missed your point the first time or people who
          have never heard of you. The idea you are sick of is brand new to almost all of them.
        </p>
        <p>
          This is the gap that trips everyone up. You have made the point maybe five times. Any one person in your
          audience has heard it, at best, once. You are counting your reps. They are counting theirs, and the two numbers
          are nowhere near each other.
        </p>

        <h2>You get tired of it first</h2>
        <p>
          There is a second reason repeating yourself feels worse than it is. You are the only person who hears every
          version. You wrote it, filmed it, edited it, watched it back four times, read the comments. By the time a post
          goes out you are so far past the idea that it feels stale in your mouth. That feeling is real, but it is yours
          alone. It is not a signal about the work. It is a side effect of being the one who makes it.
        </p>
        <p>
          Meanwhile the thing that actually makes an audience stick is the opposite of variety. It is familiarity, and
          familiarity is built by repetition. Marketers have an old rule of thumb that a person needs to run into a
          message{" "}
          <a
            href="https://www.marketingillumination.com/blogs/marketing-rule-of-7s"
            target="_blank"
            rel="noopener noreferrer"
          >
            around seven times before it lands
          </a>
          , and the honest ones will tell you the real number is usually higher now. People trust what they recognize,
          and they only recognize what they have met more than once. The repetition you are embarrassed by is the exact
          mechanism that turns a stranger into someone who knows what you are about.
        </p>
        <p>
          So the two forces line up in a cruel way. You get bored of your message at the precise moment your audience is
          starting to catch it. If you follow the boredom, you quit on the idea right before it was going to work.
        </p>

        <h2>Repeat the point, not the post</h2>
        <p>
          This is where the advice usually goes wrong, so hold it carefully. None of this is permission to upload the same
          video twice, or to say the identical sentence in the identical way until people glaze over. That does dull.
          Recognition comes from the idea underneath, not the packaging on top. The move is to keep one belief fixed and
          change everything around it.
        </p>
        <p>
          Take a creator whose whole thing is that home cooking should be simpler than people make it. That is one idea.
          It can be a rant about a fussy restaurant dish, a two minute recipe, a story about their grandmother, a list of
          five things to stop buying at the store. Four posts, four shapes, one point underneath. To them it feels like
          they keep saying the same thing. To a viewer it feels like a person with a clear point of view who keeps showing
          up with something worth watching. The repetition is what reads as having something to say.
        </p>
        <p>
          So the test is not whether you have said it before. It is whether you have said it in this shape before. If the
          form is new and the point is familiar, you are doing it right, no matter how repetitive it feels from the
          inside.
        </p>

        <h2>What you are known for is one sentence</h2>
        <p>
          Here is the part that reframes the whole fear. Think of any creator you actually remember. You can probably
          finish the sentence of what they are about in a few words. The money one who thinks debt is a trap. The trainer
          who hates the word discipline. That one clean association did not come from range. It came from someone saying
          the same thing so many times that it stuck to their name.
        </p>
        <p>
          You cannot get that by being a little bit about a lot of things. Range feels generous and it leaves no mark. The
          people who become known for something pick a point they can stand to make for years, and then they make it long
          past the moment it stopped being interesting to them.
        </p>
        <p>
          So next time you catch yourself skipping an idea because you have covered it, check what you are really
          reacting to. Most of the time it is not that the audience is tired of it. It is that you are. And you were
          always going to get there first.
        </p>
      </Article>
    </>
  );
}
