import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-cannot-pick-your-niche-before-you-post")!;

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
          The first thing anyone tells you when you want to start posting is to pick a niche. Choose a lane. Get specific.
          The riches are in the niches. So you sit down to decide what you are about, before you have made a single video,
          and you freeze. Cooking, sure, but which part of it, and for who. Or your actual job, except is that the thing
          people want from you or just the thing you happen to do all day. The blank page was bad enough. Now there is a
          blank page with a label you are supposed to write first.
        </p>
        <p>
          That freeze gets read as indecision, like you just have not thought hard enough about your angle. I think it is
          the opposite. The advice is backwards. You cannot pick a niche before you post, because a niche is not a
          decision you make at a desk. It is a thing you find out.
        </p>

        <h2>You are guessing about people you have not met yet</h2>
        <p>
          Picking a niche up front feels responsible. It sounds like strategy. But look at what you are actually doing.
          You are guessing which topic you can keep making for a year without getting sick of it, and guessing which
          topic a group of strangers you have never met will care enough to follow. Two guesses, both about the future,
          both made with almost no information, and then you build a whole plan on top of them.
        </p>
        <p>
          Most of the time at least one of the guesses is wrong. You pick the niche that sounds good in your head, the one
          you would respect, and three weeks in you realize you dread making it. Or you make it well and nobody bites, and
          you cannot tell if the idea was bad or you just have not made enough of it yet. Either way you are now stuck
          defending a choice you made blind, and the honest next move, trying something else, feels like failing at the one
          job everyone said to do first.
        </p>

        <h2>A niche is an overlap, and you can only see it from inside the work</h2>
        <p>
          Here is what a niche actually is, once you strip the marketing off it. It is the overlap between two things. One
          is the stuff you can keep making without it turning into a chore. The other is the stuff people actually stop
          and watch. Your niche lives where those two circles cross, and the hard part is that you cannot see either
          circle from the outside.
        </p>
        <p>
          You do not know what you can sustain until you have made twenty of something and noticed you still have ideas for
          it on a bad day. You do not know what lands until you have put a range of things out and watched which ones
          people actually finished and which ones they passed along. Both of those are facts about the real world, and the
          real world does not answer questions you only asked in your head. It answers the ones you posted.
        </p>

        <h2>The people you think niched down mostly did not</h2>
        <p>
          Look at almost anyone you would point to as a niche done right and you usually find years of wandering
          underneath it. MrBeast is the obvious one. He uploaded his first video in February 2012, at thirteen, as
          MrBeast6000, doing Minecraft and Call of Duty Let&apos;s Plays and videos guessing how much money other
          YouTubers made. That went on for years. The format that made him what he is, the big stunt built around a huge
          number, did not really click until he filmed himself counting to 100,000 out loud in{" "}
          <a href="https://en.wikipedia.org/wiki/MrBeast" target="_blank" rel="noopener noreferrer">
            2017, about five years in
          </a>
          .
        </p>
        <p>
          Nobody handed a teenage MrBeast that niche at a whiteboard. He found it by making a lot of things that were not
          it and paying very close attention to the one that was. The niche was the output of five years of posting, not
          the input that started it. We only call it a clean decision now because we are reading the story backwards, from
          the one version that worked.
        </p>

        <h2>Post a spread on purpose, then let it narrow you</h2>
        <p>
          So if you cannot pick, what do you do instead. You post a spread on purpose. Not random, not everything, but a
          small handful of things you would genuinely be okay making more of, a few flavors inside one rough theme. Then
          you make enough of each that the results actually mean something, and you read the results honestly.
        </p>
        <p>
          Say you like to cook. The spread is not just recipes on repeat. One week you post the fast thing you actually
          throw together on a Tuesday. The next, the story behind a dish your family has made for years. The next, you
          answer the basic question everyone is too embarrassed to ask out loud. Then the one where it comes out ugly and
          you show it anyway. Same kitchen, four different jobs. After a month you will know which one people wanted and
          which one you could do forever, and those are almost never the ones you would have bet on sitting still.
        </p>
        <p>
          Read the results on both axes, not just the one everyone watches. Which ones did people respond to, sure, but
          also which ones did you open the app excited to make. The video that did great numbers and that you never want
          to film again is a trap, not a niche. The one that did fine and that you would happily make fifty more of is
          worth more than it looks. Where a topic scores on both is the lane, and now you actually know it instead of
          hoping.
        </p>
        <p>
          The narrowing is real and you should do it. Being known for one thing is how people decide to follow you rather
          than just watch once. But it comes second. You earn the right to niche down by first finding out, from evidence,
          what your niche even is. Narrowing before you have that is just guessing with more confidence.
        </p>

        <h2>The niche is the reward, not the entry fee</h2>
        <p>
          The reason the standard advice sticks around is that it looks like the safe, serious thing to do. Deciding feels
          like control. But deciding early is not control. It is committing to a guess sooner, and a guess does not get
          better because you made it before you had any information to make it with.
        </p>
        <p>
          So if you have been sitting on a folder of clips because you have not figured out your niche yet, you have it
          backwards, and it is not really your fault, because everyone told you to. Start posting the spread. The niche is
          not the thing you decide so that you are allowed to begin. It is the thing that starts to show up once you have.
        </p>
      </Article>
    </>
  );
}
