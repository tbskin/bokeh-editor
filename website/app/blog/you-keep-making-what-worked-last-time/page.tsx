import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-keep-making-what-worked-last-time")!;

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
          You keep making a certain kind of video, and the odd one you wanted to try never quite gets made. You can say
          you were busy or that the idea was not ready, but the pattern of what you skip is too consistent for that. You
          built an account that pays you for one thing, and now every other thing feels expensive to make.
        </p>
        <p>
          It happens in very small steps. Every video is a tiny experiment. This idea, this length, this opening, this
          tone. Some do their normal numbers and some do a little better. The little better ones are the ones you
          remember, and next time you sit down you tilt very slightly toward whatever that video did. One post at a time
          it feels like listening to the audience. A hundred posts in it is something else.
        </p>

        <h2>The reason the tilt is so sticky</h2>
        <p>
          Rewards that arrive on an unpredictable schedule, the way likes and views and comments do, are the most
          habit-forming pattern anyone has measured. B. F. Skinner mapped out four basic reinforcement schedules in the
          1950s, and the variable-ratio one, where the reward comes after some unpredictable number of tries,{" "}
          <a
            href="https://courses.lumenlearning.com/waymaker-psychology/chapter/reading-reinforcement-schedules/"
            target="_blank"
            rel="noopener noreferrer"
          >
            produced the highest response rate and the greatest resistance to giving up
          </a>{" "}
          of any pattern he tested. Slot machines were built against exactly this schedule. Feeds and creator dashboards
          run on it too, and the interesting part is that the person being trained by the schedule is not only the person
          scrolling. It is also you, checking your numbers the morning after you post.
        </p>
        <p>
          The training does not stop at how often you post. A 2025 systematic review of research on creators found that
          the pressure to be visible to a recommendation algorithm{" "}
          <a
            href="https://journals.sagepub.com/doi/10.1177/09500170251325784"
            target="_blank"
            rel="noopener noreferrer"
          >
            shapes the topics discussed, the genres, the video lengths, the titles, the thumbnail design, and even the
            organization of speech
          </a>
          . All of that shifted by numbers that have no view on whether the work is any good. The metric is watch time,
          and watch time is what moves you.
        </p>

        <h2>You can defend each choice, not the sum</h2>
        <p>
          You can defend every one of these tilts. Maybe a slightly longer intro because that video did better with a beat
          of setup, or a slightly different opening line because you noticed strangers not finishing. Each is a
          reasonable response to real data. What you cannot defend is the sum, because you never see the sum. You only
          see the account you did make, not the one you did not, and the one you did make is the average of every small
          reward.
        </p>
        <p>
          Which is why the drift does not look like drift, it looks like getting better. You are making cleaner versions
          of what got engagement, and the numbers even nudge upward for a while, and it takes months to notice that the
          reasons you started, the specific thing you were excited to say, the specific person you wanted to be on
          camera, have quietly been dropped a small choice at a time. If you sat next to the person you were a year ago
          and showed them your last month, they would notice things you cannot see, not that it is worse, just different
          in ways you did not decide.
        </p>

        <h2>The tell is the ones you skipped</h2>
        <p>
          Sit with the last month and write down the ideas you had and did not make. Not the ones you never thought of,
          the ones you thought of and passed on. If they share a shape, longer, weirder, slower, more personal, less
          like what your account normally does, that shape is what is being trained out of you.
        </p>
        <p>
          The loop only ever trains you on the videos that got posted. The ones you did not film are missing from the
          record, so the category never gets a fair test. You post one weird one, it does a normal number, and you
          quietly file the whole category under does not work, when what you actually read was one data point in a
          category you barely tried.
        </p>

        <h2>What to do about it</h2>
        <p>
          Keep the reason written down. One sentence about why you started this account, saved somewhere you look. It is
          embarrassing to have to write it and that is the point. Anything you can measure will drift, and the numbers
          will always be louder than a mood, so you need a fixed thing to look back at.
        </p>
        <p>
          Rewatch a video from six months ago before you post today. Ask whether the person who made that would want to
          make the video you are about to post. If not, you have drifted. You should probably still post today, because
          live posts are the only thing that ever teaches you anything, but you now know something you did not know an
          hour ago.
        </p>
        <p>
          Post the odd one on purpose. Once a month, make one of the videos on your skipped list, the one whose shape
          looks nothing like your last ten. It will probably do a normal number, and you will not learn anything
          definite from it, and that is fine. Variance is the only thing keeping you from converging on nothing. An
          account with a few odd videos in it is more interesting than one that has been smoothed down to the average of
          what worked last quarter.
        </p>

        <h2>The account is not the only one you could have made</h2>
        <p>
          None of this is a case that your account is fake or that you sold out. Your work is yours and the numbers you
          got were real. It is only that the account you have is not the only account you could have made from the same
          year of work. Sitting on the same footage and ideas, given a slightly different feed and a slightly different
          first thousand followers, you would have made a different set of choices and be in a different place now. That
          is not a failure, it is only a thing to notice.
        </p>
        <p>
          The reason to notice it now is not to undo anything you made. It is to keep the small part of you that still
          has choices from getting eaten by the part of you that reads the graph.
        </p>
      </Article>
    </>
  );
}
