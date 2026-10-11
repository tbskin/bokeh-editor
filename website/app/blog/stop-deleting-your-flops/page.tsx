import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("stop-deleting-your-flops")!;

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
          You had a rough week. Two or three videos went out and did almost nothing, a couple hundred views and not much
          else, and last night you opened your profile and deleted them. It felt like tidying. Clear the misses out so the
          grid looks like the account of a person who only makes good things.
        </p>
        <p>
          That delete is the mistake, and it is a common one. It comes from an assumption you probably never said out
          loud. That a video&apos;s numbers on day one are the final score. They are not. On these apps the day you post is
          the start of a video&apos;s life, not the whole of it.
        </p>

        <h2>The score you acted on was a day old</h2>
        <p>
          A short video does not expire the day the views slow down. It gets a push for a day or two, and when that push is
          quiet, most people read the quiet as the end. The video does not go anywhere though. It sits on your profile and
          in the app&apos;s memory, and the app keeps checking back on it. When a sound it used comes back around, or
          someone searches the exact thing it answers, or the topic gets warm again, an old post can wake up and start
          moving. There is{" "}
          <a href="https://topqlearn.com/how-long-tiktok-pushes-video-lifecycle" target="_blank" rel="noopener noreferrer">
            no expiration date on a video
          </a>
          , and plenty of them that looked dead in week one found their real audience months later.
        </p>
        <p>
          So when you delete a post for underperforming, you are not deleting a failure. You are deleting a lottery ticket
          you decided not to hold. The video that flopped this week is the same video that could get searched up next
          quarter, and once it is gone it is gone. Delete is the one move on these apps you do not get to take back.
        </p>

        <h2>You deleted it before it was judged</h2>
        <p>
          Here is the part that should sting a little. The flop you are embarrassed by was never really put in front of your
          audience. It went to a small first batch, on whatever afternoon you posted, next to whatever else was hot that
          day, and that batch did not bite. That is not your audience handing down a verdict. That is one small group, on
          one day, not reacting.
        </p>
        <p>
          We are bad judges of our own videos anyway. Being close to the work, you grade it on the effort and the backstory
          nobody watching can see, and the feeling of &quot;this one is bad&quot; barely matches how things actually do.
          Now look at what the delete does. You take the video you feel worst about, on the day it looked worst, and you
          make that call permanent. You have let your lowest moment of confidence throw out something you never gave a fair
          read. There are{" "}
          <a
            href="https://www.claireroper.com/post/why-you-shouldn-t-delete-that-tiktok-even-if-no-one-watched-it"
            target="_blank"
            rel="noopener noreferrer"
          >
            creators who will tell you
          </a>{" "}
          not to delete a post even when nobody watched it, for exactly this reason. You do not get that turnaround if you
          clean as you go.
        </p>
        <p>
          If a post genuinely bothers you, the app already offers a softer move than the delete. You can set it to private
          or hide it and get the clean grid without shutting the door for good. The only reason to reach for delete instead
          is that delete feels final, and final feels like control. It is not control. It is just the one version of this
          you cannot undo.
        </p>

        <h2>The grid is the first thing a stranger reads</h2>
        <p>
          There is another cost to the spotless profile, and it lands right where you want your growth to come from. When a
          video does hit and sends someone to your page, that stranger spends a moment deciding whether there is a reason to
          stay. They are not reading your bio like a resume. They are skimming for one thing. Is there more where that came
          from, and does this look like a person who actually shows up.
        </p>
        <p>
          A profile with three perfect posts does not answer that. It looks brand new, or it looks like someone who quit
          twice and started over, which reads about the same to a visitor. A profile with a real stack of videos, a few
          obvious hits and a lot of ordinary ones, looks like what it is. Someone who has been at this a while and keeps
          making things. The ordinary videos are not dead weight pulling down an average. They are the texture that makes
          the account look lived in, and lived in is what the new person is deciding to follow. You spend all this energy
          earning the visit, then delete the thing that would have earned the follow.
        </p>

        <h2>The only thing worth taking down</h2>
        <p>
          None of this means keep every second you ever filmed. There is a real reason to remove a post, and it is not the
          view count. It is fit. If the account is about one thing now and an old video points at something you have long
          since moved past, it can confuse the stranger trying to work out what you do. That is worth fixing. Even then,
          hide it, do not delete it. Move it out of the visitor&apos;s way and keep your own copy and its history.
        </p>
        <p>
          Sort your posts by the wrong question and you will cut the wrong ones. Sort by &quot;am I proud of this&quot; and
          you delete your quiet, useful, searchable videos and keep the flashy ones that spiked and vanished. Sort by
          &quot;does this still say what the account is about&quot; and you keep almost all of it, because almost all of it
          still counts as showing up.
        </p>
        <p>
          The urge to delete a flop feels like having standards. Most of the time it is just flinching. And the account
          that looks like it never missed also looks, to the person who just found it, like it has barely done anything at
          all. Leave the misses up. They are the proof you were here.
        </p>
      </Article>
    </>
  );
}
