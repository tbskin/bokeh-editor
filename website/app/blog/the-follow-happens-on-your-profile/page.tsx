import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("the-follow-happens-on-your-profile")!;

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
          Someone watches your video all the way to the end. They like it. They might even tap the heart. Then they do
          the thing that actually decides whether you grow, and you never see it happen. They tap your name. Your profile
          loads. They look at it for about two seconds, and they keep scrolling, without following.
        </p>
        <p>
          You will see that video&apos;s numbers later and read a decent watch time and a few likes and call it fine. It
          was fine, at the only thing a single video can do. What the numbers hide is the next beat, the one where the
          video handed someone to your profile and your profile handed them back to the feed. You keep trying to make the
          video better. The video is not where you lost them.
        </p>

        <h2>The video only has to win the tap</h2>
        <p>
          A single video almost never earns a follow on its own. It earns something smaller and more specific, enough
          curiosity that a person wants to check whether there is more. That is a real win, and it is where the
          video&apos;s job ends. The follow is a separate decision, made one screen later, on a different page, about a
          different question.
        </p>
        <p>
          The platforms already treat these as two events. TikTok counts{" "}
          <a
            href="https://databox.com/metric-library/metrics/tiktok-organic/profile-views"
            target="_blank"
            rel="noopener noreferrer"
          >
            profile views
          </a>{" "}
          as their own number, the times someone tapped through to your account after seeing a video. A view is a
          passive thing that can happen while a thumb keeps moving. A profile visit is someone stopping to look closer.
          And most of them, having looked closer, still leave. On Instagram the average profile lands around a{" "}
          <a
            href="https://www.flick.social/learn/instagram-analytics-benchmarks/insights/conversion-rate/month"
            target="_blank"
            rel="noopener noreferrer"
          >
            13.5 percent conversion from profile visit to follow
          </a>
          , which is another way of saying that roughly seven of every eight people curious enough to come look decide,
          once they are looking, not to stay. That gap is not a video problem. The video already did its part by getting
          them there. Everything after the tap belongs to the profile, and almost no one works on the profile.
        </p>

        <h2>What your profile has three seconds to answer</h2>
        <p>
          The visitor is not asking whether the video was good. They answered that when they tapped. They arrive with
          two quick questions and give you about three seconds to answer both. What is this account. And is there more of
          the thing I just liked.
        </p>
        <p>
          Most profiles answer neither. The bio is a clever line or a stack of titles. The recent posts are whatever
          happened to go up, a talking head next to a meme next to a photo from a trip, in an order that tells a stranger
          nothing about what following you would get them. Someone who liked one specific thing lands here, cannot find
          more of that thing, cannot tell in a glance what they would be signing up for, and leaves. Not because they
          changed their mind about you. Because you did not answer the question they came with.
        </p>
        <p>
          The fix is not more posts. It is making the profile legible to a person who just met you. When someone lands,
          the top of it should make obvious what this account is about and put a few more of the thing that made them
          curious right where they can see it. That is a layout choice, and it costs nothing, and people skip it because
          they are already looking at the next video instead of the doorway every video points at.
        </p>

        <h2>You are leaking the reach you already have</h2>
        <p>
          Here is why this beats another growth tactic. Almost all the advice is about reach, about getting your video in
          front of more people. But you are already getting in front of people every time a video does even okay, and a
          real share of them are tapping through and then leaving. The shortage is not attention at the top. It is the
          drop at the profile, where the people your reach already delivered are the cheapest followers you will ever
          get, and most of them walk.
        </p>
        <p>
          A video that goes big makes the leak loud. A wave of exactly the right people, the ones who liked precisely
          what you made, all tap through in a single day, hit a profile that does not answer them, and are gone by
          evening. Then your next post reaches almost none of them and you file the hit under luck. Some of it was. Part
          of it was a profile that could not hold the one crowd most likely to say yes. Widening the top does nothing
          while the bottom leaks.
        </p>

        <h2>Open your own profile like a stranger</h2>
        <p>
          So do the thing the stranger does. After you post, open your own profile cold, the way someone would who
          watched one video and got curious, and give it the three seconds they would give it. Can you tell what this is
          for. Can you find more of the thing that made someone tap. If you cannot, you just watched a follow leave, and
          you can fix it in an afternoon without shooting anything new.
        </p>
        <p>
          Most people never look at their profile this way. They see it as the archive of everything they have made,
          newest on top, which is the one view no visitor ever gets. To a stranger it is not an archive. It is a first
          impression with a scroll bar, quietly answering a question you did not know it was being asked.
        </p>
        <p>
          Your next follower will probably not come from a better video than the one you already posted. They will come
          from the two seconds after someone liked that video and went looking for a reason to stay. Right now, for most
          people, there is nothing waiting there. Put something there.
        </p>
      </Article>
    </>
  );
}
