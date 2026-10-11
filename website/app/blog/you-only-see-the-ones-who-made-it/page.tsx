import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-only-see-the-ones-who-made-it")!;

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
          You finish a video, post it, and then you stay on the app a minute too long. You scroll. And every account that
          floats past is somehow further along than you. Someone your age, in your exact lane, doing the thing you do,
          with a number under their name you have been reaching for since spring. You put the phone down a little smaller
          than you picked it up, and the thought follows you around for the rest of the day. Everyone is ahead of me.
        </p>
        <p>
          Here is what that thought leaves out. The accounts you just scrolled past are the ones that made it. The much
          larger crowd of people who started when you did, hit the same numbers you have, felt this same afternoon, and
          quietly stopped, are nowhere in your feed. They cannot be. Quitting does not show up on a screen. The app only
          ever hands you the people still standing.
        </p>

        <h2>The feed keeps the winners and drops everyone else</h2>
        <p>
          The reason is plain once you look at it. A feed moves whatever is getting a response. When someone stops
          posting, their videos stop being shown, their account drifts out of circulation, and in a few weeks it reads
          like they were never there. Nobody films a goodbye. They just go quiet, and quiet makes no posts for you to
          see. So the parade you scroll through every day has already been cut down to the people who kept going and
          caught a little traction, with everyone who gave up missing from it.
        </p>
        <p>
          And the ones who gave up are most of the crowd. In one study that followed YouTube channels for seven years,{" "}
          <a
            href="https://creatormap.io/blog/youtube-channel-survival-rate-study-2026"
            target="_blank"
            rel="noopener noreferrer"
          >
            about three in four of the channels that started in 2019 had gone dormant, faded, or vanished
          </a>{" "}
          by the end, and most of the smallest ones never really got going in the first place. Almost everyone who starts
          this lands somewhere near where you are right now, and then most of them leave. You never witness any of it,
          because leaving is the one thing a feed built to show you what is working will never show you.
        </p>
        <p>
          Try it directly. Think of one specific account you followed a year ago that made videos like yours and had
          numbers like yours, and go look for it now. Most of the time you cannot find it, because it did not fail out
          loud. The person posted less, then stopped, and the feed closed over the gap. That person is exactly who you
          should be measuring yourself against, and they are the one person the app will never put back in front of you.
        </p>

        <h2>You are looking at the planes that came back</h2>
        <p>
          There is a sharp old version of this mistake. During the war, analysts studied the bombers that came home
          riddled with bullet holes and wanted to add armor wherever the holes clustered. A statistician named Abraham
          Wald{" "}
          <a
            href="https://medium.com/@penguinpress/an-excerpt-from-how-not-to-be-wrong-by-jordan-ellenberg-664e708cfc3d"
            target="_blank"
            rel="noopener noreferrer"
          >
            caught the flaw everyone else had walked past
          </a>
          . They were only ever looking at the planes that made it back. The holes bunched up in the spots where a plane
          could take a hit and still fly. The planes shot in the other places were not in the yard to be counted, because
          they had gone down. The armor belonged exactly where the survivors showed no damage at all.
        </p>
        <p>
          Your feed is that yard of returning planes. You study the accounts parked in front of you, the ones that took
          their hits and still fly, and you read off a verdict about how far behind you are. But the true comparison is
          against everyone who started, and most of that group is simply not in the picture, sitting right where you are
          or below it, already gone. The people you can see are a filtered sample, and the filter is the exact thing you
          are afraid of. Measured against the whole field instead of the survivors, still being here at all puts you
          ahead of a crowd you cannot see.
        </p>

        <h2>The only fair comparison is the one you can see all of</h2>
        <p>
          So what do you do with a comparison that is stacked against you before you make it. Not stop noticing other
          people. You could not if you tried, and it is not even the problem. The fix is to notice who is absent. When
          the feeling lands that everyone is further along, the honest correction is that everyone still here is further
          along, and nearly everyone who was where you are did not stay long enough to find out what came next.
        </p>
        <p>
          The one comparison nobody filtered for you is you against your own few months ago. That earlier version of you
          is not a winner picked out by an algorithm. It is the full, unedited record of one person, which makes it the
          only measuring stick that tells you whether the work is actually moving. Whether your videos are sharper than
          the ones you made in spring, and whether the thing you can pull off in one evening has gotten bigger than it
          used to be. If the answer is yes, you are winning the only race with clean numbers in it.
        </p>

        <h2>Still being here is the whole trick</h2>
        <p>
          The part that stings and then loosens something is this. What separates the accounts you envy from the ones
          that disappeared is mostly not talent, and it is not some trick they found and you missed. They were still
          posting the week the growth finally arrived. From the outside that looks like a gift. From the inside it was
          just a person who did not quit during a stretch that felt exactly like the one you are in right now.
        </p>
        <p>
          So the next time you set the phone down feeling behind, be clear about what a full feed actually is. Not a
          starting line you are losing at. It is closer to the far end of a long race with everyone who dropped out
          already off the course and out of sight. You are not behind the field. You are still in it, which is the only
          real thing any of the people you compare yourself to ever had on you.
        </p>
      </Article>
    </>
  );
}
