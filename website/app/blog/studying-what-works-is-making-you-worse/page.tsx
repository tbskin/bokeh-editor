import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("studying-what-works-is-making-you-worse")!;

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
          You open the app to do research. Not to scroll, you tell yourself, to study. You want to see what is landing
          right now in your corner, what the accounts one rung above you are posting, what is pulling the numbers you
          want. It feels like the responsible thing, the homework a serious person does. An hour later you close the app
          knowing more and feeling worse, and the idea you were excited about this morning suddenly looks small and
          obvious next to everything you just watched.
        </p>
        <p>
          That hour was not free. Study what is working is the advice everyone gives, and it sounds like the opposite of
          a mistake. But the habit has two costs nobody mentions, and both of them land on the exact part of you that
          was going to make something worth watching.
        </p>

        <h2>It pulls everyone toward the same middle</h2>
        <p>
          When you study what is doing well, you do the natural thing with it. You make your next video a little more
          like it. So does everyone else watching the same winners. Multiply that across a whole niche, week after week,
          and the work quietly converges on one shape. Nobody decides to copy. Everyone just keeps nudging toward proof,
          and proof looks like what already worked.
        </p>
        <p>
          The size of that pull shows up in the numbers. Researchers who studied Douyin, the Chinese version of TikTok,
          found that roughly{" "}
          <a
            href="https://hbem.org/index.php/OJS/article/view/577"
            target="_blank"
            rel="noopener noreferrer"
          >
            90 percent of creators end up imitating what already works
          </a>{" "}
          rather than trying something new, because copying a proven video feels safer than risking one nobody sees. In a
          survey of ten thousand of that platform&apos;s users, 63 percent said most videos now feel the same. Once you
          have watched fifty clips in your lane, your sense of a good idea has been quietly rewritten to mean a familiar
          one.
        </p>
        <p>
          Here is why that backfires. The feed&apos;s whole job is to tell things apart. If your video wears the same
          shape as the twenty before it, being slightly better than those twenty is not enough, because the viewer has
          already seen the shape and their thumb keeps moving. The research you did to fit in is the reason you blend in.
          You studied your way to average and then wondered why average did not travel.
        </p>

        <h2>It resets your normal to everyone&apos;s best day</h2>
        <p>
          The second cost is quieter and it lands on your mood. When you spend an hour on the top posts in your niche,
          you are watching a highlight reel. You see the ones that hit, with the nine that flopped, the dead months, and
          the takes they deleted all edited out. Then you hold your own ordinary Tuesday up against that, and your
          numbers, which may be completely fine, start to read as failure. You have moved the bar to other people&apos;s
          best moments and left it there.
        </p>
        <p>
          You are also comparing the wrong two things. You see their finished, chosen, filtered product and you measure
          it against your whole messy process, the doubt and the reshoots and the post that took all night. Of course
          you come out behind. You always will, because you are matching their outside against your inside.
        </p>
        <p>
          This is not a soft effect. In a 2024 survey of creators, 64 percent said that{" "}
          <a
            href="https://martechedge.com/news/new-research-reveals-high-burnout-rates-among-content-creators-and-influencers"
            target="_blank"
            rel="noopener noreferrer"
          >
            comparing themselves to other creators makes their burnout worse
          </a>
          . Comparison is not information. It is a feeling wearing the costume of research, and the feeling it hands you
          is that you are behind. People rarely quit because one video failed. They quit because they spent months
          feeling behind, and a lot of that feeling is manufactured in the hour they thought they were studying.
        </p>

        <h2>Understanding is not the same as absorbing</h2>
        <p>
          There is a real version of learning from others, and it is worth keeping. If a video takes off, it can be
          genuinely useful to ask why, once, and get an answer you can say in a sentence. It opened on the problem
          instead of the setup. It made you feel let in on something. That kind of understanding is portable. You can
          carry the reason into your own work without carrying the video.
        </p>
        <p>
          Absorbing is the other thing, and it is what most studying actually is. Not asking why one video worked, but
          soaking in fifty of them until your taste has quietly moved to match the average of the feed. You do not walk
          away with a principle. You walk away with a mood and a slightly more generic instinct. The difference is
          dosage. One example, examined, teaches you something. Fifty, half-watched, just recalibrate you toward
          everyone else.
        </p>

        <h2>Make more than you watch</h2>
        <p>
          The fix is not to swear off other creators forever. You will still see things, still catch influences, still
          learn. The change is about proportion. Most people take in far more of their own niche than they put out, and
          the ratio is backwards.
        </p>
        <p>
          Two moves help. First, when you do watch, watch wide, not near. The person worth studying is usually not the
          one doing your exact thing one step ahead of you. It is someone in a different world, a chef, a historian, a
          woodworker, whose way of holding your attention you can borrow precisely because none of their content maps
          onto yours. You take the structure and leave the subject. Second, spend the hour you would have spent studying
          on making one more thing instead. A rough video you actually finished tells you more about what works for you
          than a hundred polished ones you watched, because it is the only test that ran on your real audience.
        </p>
        <p>
          The uncomfortable part is that studying feels like work and making feels like a risk, so people drift toward
          the safe, draining version of the job: watch more, post less, feel worse. But you cannot learn your way to a
          voice by watching other people use theirs. The thing you keep looking for in all those videos was never in
          them. It only turns up in the ones you make, and only after you stop grading them against someone else&apos;s
          best day.
        </p>
      </Article>
    </>
  );
}
