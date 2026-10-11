import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("nothing-you-post-pays-you-back-right-away")!;

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
          You post something, and instead of the small lift you expected, you feel a little flat. You check twenty minutes
          later and it is at eleven views. You check again before bed and it is at forty, from people you will never meet,
          and somewhere in there a quiet part of you has already decided the video did not work, and maybe none of them do.
          Nothing bad happened. You just did not get anything back.
        </p>
        <p>
          When people stop posting they say they lost motivation, or that they are not disciplined enough. That is almost
          always the wrong read. You did not run low on some willpower stat. You picked one of the only creative things a
          person can do that pays you back late, and slow, and in a currency you can barely feel, and then you blamed
          yourself for not sticking with it.
        </p>

        <h2>Everything else you do pays you back now</h2>
        <p>
          Think about the other things you make. You play a chord on the guitar and it sounds right in the same second.
          You cook something and you taste it that night. You tell a friend a story and they laugh while you are still
          talking. Every one of those hands you a small reward at the exact moment you did the work, and that little
          payment on the spot is most of what makes you want to do it again tomorrow. Posting a video does close to the
          opposite. You do the whole thing, the filming and the redone take and the caption that would not come, you press
          post, and then nothing. Silence for hours. Maybe a number the next day that means little on its own.
        </p>
        <p>
          That gap is not a small detail. It is close to the whole reason the habit is so hard to keep. When Kaitlin
          Woolley and Ayelet Fishbach gave people a bonus while they were still working on a task instead of at the end,
          the people paid sooner enjoyed the task more and were{" "}
          <a
            href="https://news.cornell.edu/stories/2018/06/its-about-time-immediate-rewards-boost-motivation"
            target="_blank"
            rel="noopener noreferrer"
          >
            35 percent more likely to keep doing it
          </a>{" "}
          after the reward stopped, while making the reward bigger only bought a 19 percent bump. The timing mattered more
          than the size. What keeps you coming back to a thing is not how big the payoff is. It is how soon it lands, and
          posting fails that test worse than almost anything you do.
        </p>

        <h2>The payoff really does come late</h2>
        <p>
          And you are not imagining the delay. A video does not get its answer in the first hour, or even the first day.
          On TikTok the biggest surge of views tends to arrive{" "}
          <a href="https://www.socialinsider.io/blog/tiktok-virality-insights/" target="_blank" rel="noopener noreferrer">
            across the first one to five days
          </a>
          , not the first afternoon, and plenty of videos sit quiet for a week and then get picked up, or catch on weeks
          later, or never move at all. So the moment you are most likely to check, right after posting, is the moment with
          the least information in it. You are reading a verdict off a race that has barely started.
        </p>
        <p>
          That sets up a cruel little loop. The reward is late and faint by nature. You, being a person, check early and
          often, because you want the hit. You find almost nothing, because there is almost nothing there yet. You feel the
          flatness, quietly file it as failure, and carry that feeling into whether you bother making the next one. When
          the payoff for an action is delayed, people simply{" "}
          <a href="https://www.nature.com/articles/s41539-025-00325-2" target="_blank" rel="noopener noreferrer">
            do the action less
          </a>
          . So this is not a dramatic quit. It is a slow drift where the next video feels a little more pointless each
          time, until one week you do not make it, and then you do not make the one after that.
        </p>

        <h2>You are not lazy, your reward is in the mail</h2>
        <p>
          This matters because the fix is completely different depending on which problem you think you have. If it is
          discipline, the answer is to grit harder, post daily, force it. That is the advice everyone gives, and it is why
          so many people burn out, because you are trying to muscle through a motivation system that was set up to starve.
          If the real problem is that your reward arrives late and you cannot feel it, the answer is the reverse. Stop
          waiting on that reward, and build one you can feel today.
        </p>
        <p>
          The most reliable version is to make the doing itself the thing that pays you, so you get something at the moment
          of work the way every other hobby pays you, not days later from a count. That means guarding the parts you
          actually like, the talking and the idea and being on camera, and cutting the parts you dread, because when the
          process is a slog the only reward left is the number, and the number comes late. Some people get their fast hit
          from one real person, sending it to someone whose reaction is instant and honest so they get the laugh or the
          &quot;oh that is good&quot; while it is still fresh. Some people keep a streak they fully control, a mark for
          having posted at all, which pays out the second you hit the button and owes nothing to the algorithm. None of
          this makes you grow faster. It keeps you in the game long enough that the slow reward has a chance to show up.
        </p>

        <h2>The number is late mail</h2>
        <p>
          So when you open the app the morning after and the count is small, try to see it for what it is. It is not the
          audience deciding, and it is not a readout of whether you should keep going. It is late mail, an early and mostly
          empty update on a video that has barely started its life, and it lands right when you are most tempted to make it
          mean everything. Read it that way and it loses the power to end your week.
        </p>
        <p>
          The people who are still posting a year from now did not find more discipline than you. They found a way to feel
          good about the work on the day they did it, and they let the slow reward catch up on its own time.
        </p>
      </Article>
    </>
  );
}
