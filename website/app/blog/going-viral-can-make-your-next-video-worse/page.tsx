import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("going-viral-can-make-your-next-video-worse")!;

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
          You posted something on a Tuesday and by lunch it was doing numbers you had never seen. The view counter would
          not sit still. A few hundred new followers by the afternoon, then a few thousand by the time you went to bed.
          For one night it felt like the quiet months had all been runway and this was finally the takeoff.
        </p>
        <p>
          Then you posted again a few days later and it did worse than usual. Not viral-and-back-to-normal worse. Worse
          than the small videos you were making before any of this happened. You told yourself you had a dud, or the
          moment had passed, or the feed had cooled on you. There is a stranger explanation worth sitting with. The big
          day might not have been the reward. It might have been the thing that set you back.
        </p>

        <h2>Most of a viral crowd was never yours</h2>
        <p>
          A viral video pulls in a crowd, and a crowd is not the same as an audience. The people who ran your numbers up
          were not looking for you. They were scrolling, the feed put your video in front of them, they watched, some
          tapped follow without much thought, and then they kept going into the next stranger&apos;s life. Going viral
          and building an audience feel like one event. They are{" "}
          <a
            href="https://www.justtalkstudios.com/post/the-real-difference-between-going-viral-and-building-an-audience"
            target="_blank"
            rel="noopener noreferrer"
          >
            two different things
          </a>
          , and treating the first like the second is where a lot of promising runs quietly go wrong.
        </p>
        <p>
          Look at who actually stays. A video can reach a million people and only a thin slice ever follow, and of the
          ones who do, most never watch a second thing you make. You are left with a much bigger number beside your name
          and not many more people who care what you do next. Even the spike itself is short. Creators watch the views{" "}
          <a
            href="https://www.advancedcreativemedia.co/post/your-tiktok-went-viral"
            target="_blank"
            rel="noopener noreferrer"
          >
            settle back to normal within about a week
          </a>
          , and the ones who build something that lasts are usually not the ones who go viral the most often. The count
          went up. The audience mostly did not.
        </p>

        <h2>The wrong crowd is not free</h2>
        <p>
          Here is the part that stings. Those new followers are not sitting there as a harmless trophy. Every time you
          post, the feed asks a small question about your account before it decides how far to push you. It shows the
          video to some of your own followers first and watches what they do. Do they stop and watch, or thumb past on
          sight.
        </p>
        <p>
          Now think about what a viral crowd does to that test. You just added thousands of people who followed on a
          whim, for one video, about one thing, with no real interest in you. Post again and the feed tries the new
          video on a sample of them, the way it always starts close to home. They scroll straight past, because they were
          never yours to begin with. The feed reads that shrug as a verdict on the video itself, and shows it to fewer
          people. The audience you spent months actually earning, the people who would have watched and passed it on, now
          sit behind a wall of followers who will not respond to anything.
        </p>
        <p>
          So the video that felt like your biggest win can quietly lower the ceiling on the next ten. Not always, and not
          forever. But often enough that &quot;it blew up&quot; and &quot;things got better&quot; are two separate
          sentences that do not always follow each other.
        </p>

        <h2>The number rewires what normal feels like</h2>
        <p>
          There is a second cost, and this one is inside your own head. Before the spike, a good day was maybe five
          hundred views and a few kind comments, and you knew how to feel about that. After a video does a million, five
          hundred looks like failure. Your sense of a normal day got dragged up to a height you cannot reach again on
          purpose, and now every ordinary post, the exact kind that was slowly working, feels like sliding backward.
        </p>
        <p>
          A lot of people quit right here, and they misread why. The work did not get worse. One lucky outlier moved the
          finish line, and nothing they make can touch it anymore, so making anything at all starts to feel pointless.
          Chasing the next hit only deepens the hole. You are not building toward a bigger version of what worked,
          because you never learned what worked. You are betting on another fluke and judging every honest, steady result
          against the one time you got lucky.
        </p>

        <h2>What a spike is actually good for</h2>
        <p>
          None of this means a viral video is bad luck you should hope to avoid. It means the number on the day is not
          the part to read. The part to read is who it left behind.
        </p>
        <p>
          When something takes off, go find the few people who stayed and engaged like they meant it. Read their
          comments. What did they have in common, and what was the video really about under the format that carried it.
          That signal is small and easy to lose beneath the big number, and it is the only piece of a viral day worth
          keeping. You do not need{" "}
          <a
            href="https://www.justtalkstudios.com/post/the-real-difference-between-going-viral-and-building-an-audience"
            target="_blank"
            rel="noopener noreferrer"
          >
            ten thousand of the wrong people
          </a>
          . You need the handful of right ones, and you make the next thing for them instead of for the crowd that has
          already moved on.
        </p>
        <p>
          And if a video pops for a reason that has nothing to do with what you actually want to make, a sound, a
          gimmick, a fluke of timing, you are allowed to let that audience drift. Holding onto them means slowly becoming
          the thing they followed you for, which was never you in the first place. A small group who came for the real
          work will carry you further than a huge one that came for a moment.
        </p>
        <p>
          The counter spinning felt like arrival. It was closer to weather. A front rolled in, dropped a crowd on your
          doorstep, and most of them were gone by the weekend. The honest question a big day asks is not how many showed
          up. It is whether any of them were looking for you before they landed there, and whether you gave the few who
          were a reason to come back.
        </p>
      </Article>
    </>
  );
}
