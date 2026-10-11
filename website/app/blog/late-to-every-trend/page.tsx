import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("late-to-every-trend")!;

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
          A sound starts showing up in your feed. Once, then a few more times, and by the weekend it is everywhere, the
          same clip under a hundred different videos. So you make yours. You film it, cut it to the beat, write the
          caption the way the popular ones did. It goes out and does almost nothing. A couple hundred views and a small
          private thought that you did it wrong, that your version was not clever enough or you missed something in the
          edit.
        </p>
        <p>
          Your version was probably fine. The problem was the calendar. You were late, and you were late the moment you
          first noticed the trend at all.
        </p>

        <h2>The trend you can see has already peaked</h2>
        <p>
          By the time a trend is visible to you, most of it is already spent. A trend on a short video app used to run a
          week or two. Now the average one lives about{" "}
          <a href="https://www.thelist.com/800454/how-long-does-an-average-tiktok-trend-last/" target="_blank" rel="noopener noreferrer">
            three to five days
          </a>{" "}
          before people are tired of seeing it. And the reach a trend hands out is not spread evenly across those days.
          It is loaded into the very front, the first day or so, while the thing is still small and the app is hunting
          for more of it. The window from a trend&apos;s first flicker to full saturation is often only{" "}
          <a
            href="https://www.advancedcreativemedia.co/post/how-to-predict-when-an-sound-trend-will-peak-on-tiktok"
            target="_blank"
            rel="noopener noreferrer"
          >
            48 to 72 hours
          </a>
          .
        </p>
        <p>
          Now put that next to how you found out about it. A trend becomes visible to you the same way it becomes
          visible to everyone, by showing up in your feed over and over. Which means the exact thing that tells you a
          trend exists, seeing it a lot, is the same thing that tells you it is already crowded. You cannot catch a trend
          early by watching your feed, because your feed only surfaces a trend once it is late. The signal and the
          saturation are the same moment.
        </p>

        <h2>You are running a race that started before the gun</h2>
        <p>
          So chasing a trend means entering a race that began before you heard it start. The versions that blow up were
          not posted on the saturated weekend you posted on. They went up early, when the sound still had a few thousand
          videos on it instead of the{" "}
          <a href="https://www.octoparse.com/blog/how-to-find-trending-sounds-on-tiktok" target="_blank" rel="noopener noreferrer">
            hundreds of thousands it has by the time you find it
          </a>
          , when the app has already turned its attention to the next thing.
        </p>
        <p>
          It is tempting to explain that gap as speed. They were faster, they have a better eye for what is about to pop,
          they check the trend pages you do not bother with. Mostly that is not it. The people who were early to a trend
          were rarely hunting for it. They were already making that kind of thing, and the trend rolled through the lane
          they were already in. They did not catch the wave early. The wave arrived late, to a spot where they were
          already standing.
        </p>
        <p>
          The advice to jump on trends sticks around because you only ever see the winners. Somebody rode a sound to a
          million views, and the story they tell, and the story you absorb, is that they caught the trend. The part that
          does not make it into the story is that they had been posting that same kind of video for months to a few
          hundred people, and this time one of those videos met a wave. You copy the visible half, the trend, and skip
          the invisible half, the months. Then you wonder why the same move did nothing for you.
        </p>

        <h2>The winners were already in the water</h2>
        <p>
          Think about how surfing actually works. Nobody catches a wave by spotting it from the sand and sprinting into
          the water. By the time you can see it clearly from the beach, it has already broken. The people who ride waves
          are sitting out past the break, doing that most mornings whether or not anything good is coming, so that when a
          decent one shows up they are already in position for it. Watching your feed for trends is standing on the sand,
          pointing at the water, chasing the one that already closed out.
        </p>
        <p>
          There is a second cost to the chase, past the bad timing. Even when a trend video does hit, the crowd it brings
          came for the trend, not for you, and they drift off with it when it moves on. Content built on trends tends to{" "}
          <a
            href="https://www.bandt.com.au/why-chasing-trends-is-a-terrible-strategy-for-brands-more-original-content-is-needed/"
            target="_blank"
            rel="noopener noreferrer"
          >
            spike and fade
          </a>
          , while the work that actually builds an audience is the part that is recognizably yours, the thing a person
          can follow and expect more of. A trend can introduce you to people. It cannot be the reason any of them stay.
        </p>

        <h2>Build the lane, not the radar</h2>
        <p>
          None of this means trends are useless or that you should refuse them out of principle. It means you have the
          job backwards if you are scanning for trends and then scrambling to dress up as each one. The move is to have a
          thing you reliably make, a subject or a way of working that is narrow enough that trends keep crossing it.
          Then you are not chasing anything. You are the person already making that, so when a relevant one comes through
          you can turn it around in an hour, and you have the standing to, because it reads as obviously yours and not a
          costume you put on for the weekend.
        </p>
        <p>
          So before you save the next trending sound to your drafts, ask a duller question than whether you can pull off
          this one. Ask what you are already making enough of that a trend could even land on it. If you cannot answer
          that, a faster trend radar will not fix anything. Pick the lane first, and post in it on the boring days when
          nothing is trending at all.
        </p>
        <p>
          The creators who look like they are early to everything are not staring harder at the trend page. They are just
          always making something, in one steady lane, standing where a wave can find them. Stop trying to see the trend
          coming. Be easy to reach when it arrives.
        </p>
      </Article>
    </>
  );
}
