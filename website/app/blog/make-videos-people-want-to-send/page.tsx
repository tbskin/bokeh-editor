import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("make-videos-people-want-to-send")!;

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
          It is 12:43 a.m. The same seven-second clip is open on your phone. Your thumb keeps dragging the trim handle one
          frame left, then one frame right. The caption has three versions in Notes. By the time you post, the room is dark
          except for the screen.
        </p>
        <p>
          In the morning, the video has a few likes and one nice comment. Then it stops. The part that hurts is not that
          strangers ignored it. It is that nobody saw a name in it. Nobody thought, I need to send this to her.
        </p>

        <h2>The person is the point</h2>
        <p>
          Before you make the next video, ask who someone would send it to. Not founders. Not creators. Not people trying
          to grow online. One person in one situation. The friend who keeps filming drafts and never posting them is more
          useful than a demographic.
        </p>
        <p>
          That question makes the idea sharper before you ever press record. A video made for everyone can stay polite. A
          video made for one kind of person has to name the thing that person is actually stuck on. It has to make the
          viewer think, this is what I was trying to tell them.
        </p>
        <p>
          This is why some true advice does not travel. &quot;Post consistently&quot; is correct, but it does not point at
          anyone. &quot;Your problem is not ideas. It is the forty clips sitting in your camera roll because editing is the
          part you dread&quot; gives the viewer a person to send it to. The point did not get louder. It got easier to place.
        </p>

        <h2>Sharing is a relationship move</h2>
        <p>
          Platforms already treat sharing as a stronger signal than quiet approval. TikTok says its recommendation system
          uses user interactions, including{" "}
          <a href="https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you" target="_blank" rel="noopener noreferrer">
            videos people like or share
          </a>
          . Instagram chief Adam Mosseri has said{" "}
          <a href="https://www.socialmediatoday.com/news/instagram-chief-post-share-rates-key-driver-reach/716540/" target="_blank" rel="noopener noreferrer">
            sends per reach correlate more with overall reach than anything else
          </a>{" "}
          in his experience. For you, the important part is simpler: a send means the viewer found a job for the video
          after watching it.
        </p>
        <p>
          That job is usually social. The New York Times studied why people share online with Latitude Research and a
          survey of more than 2,500 medium to heavy sharers, and reported that{" "}
          <a href="https://investors.nytco.com/news-and-events/press-releases/news-details/2011/The-New-York-Times-Completes-Research-on-Psychology-of-Sharing/default.aspx" target="_blank" rel="noopener noreferrer">
            the main motivations for sharing were tied to relationships
          </a>
          . People shared to help others, stay connected, and show what they cared about. That should pull you back to the
          viewer, not toward a research report. Your video is competing for a place in someone&apos;s private conversation.
        </p>
        <p>
          So do not treat shareability as a call to action at the end. &quot;Send this to someone who needs it&quot; usually
          means the video did not make the recipient obvious on its own. The stronger version earns the send earlier. It
          names the situation so cleanly that the viewer already knows where it belongs.
        </p>

        <h2>Give the viewer something they can carry</h2>
        <p>
          A sendable video has a handle. The viewer can explain it in one sentence without doing extra work. Watch this
          because it explains why your polished posts feel like ads. That kind of sentence gives the video a second life
          outside the feed.
        </p>
        <p>
          The handle usually comes from one pressure point. A frustration. A mistake. A sentence someone has been circling
          but has not said out loud yet. If the video tries to cover the whole topic, it gets harder to carry. Nobody sends
          a complete overview. They send the part that names the problem cleanly.
        </p>
        <p>
          The practical bar is plain. If a viewer could not add &quot;this is you&quot; or &quot;this is what we were talking
          about&quot; above the video, the point may still be too general. Narrow it until that message feels natural.
        </p>
        <p>
          The feed can find your first viewer. The send finds the next one. Build for the moment when a person recognizes
          another person inside the video, and the post has somewhere to go after the scroll is over.
        </p>
      </Article>
    </>
  );
}
