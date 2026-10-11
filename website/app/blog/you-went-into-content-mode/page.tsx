import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-went-into-content-mode")!;

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
          Something happened in your actual day this week that would have made a good video. Maybe you were explaining a
          thing to a friend and said it clearer than you ever have. Maybe you fixed a problem on the second try, and the
          first try, the one that went wrong, was the interesting part. You thought, half seriously, I should post that.
          Then the moment passed, and you didn&apos;t.
        </p>
        <p>
          Later, when you sat down to make content, you opened the app and made something else. Something flatter, that
          you had to build from nothing. People call the gap between those two moments an idea problem. It almost never
          is. The good idea already happened. You just weren&apos;t filming, because filming wasn&apos;t what you were
          doing right then. You were living, and content is the other thing, the one you do on purpose, later, at a desk.
        </p>

        <h2>The switch is the problem</h2>
        <p>
          Most people treat making content as a separate activity they clock into. You finish the real work, then you sit
          down to produce something about it. You face a blank screen and try to invent, on command, something a stranger
          will want to watch. That blank screen is where the drought lives. It is genuinely hard to conjure up something
          interesting out of nothing on a Tuesday night, when the interesting part of your day is already twelve hours
          behind you and half forgotten.
        </p>
        <p>
          Most advice makes the split worse. Block out a content day. Batch a month of posts in one sitting. All of it
          moves the making further from the doing, so by the time you produce, you are working from a memory of the thing
          instead of the thing itself. This is not the same as needing a better{" "}
          <Link href="/blog/the-idea-drought-is-a-format-problem">system for generating ideas</Link>. The problem is not
          that your idea machine is broken. It is that you keep turning it on hours after the good raw material has walked
          out of the room.
        </p>

        <h2>A made video is a guess, a caught one already passed a test</h2>
        <p>
          Here is the part that changes how you look at your own week. When you manufacture a video from scratch, you are
          guessing what will land, and people are bad judges of their own guesses. But the moment in your real day that
          made you think that is interesting had already passed a test. It was interesting enough to actually happen.
          Interesting enough that you wanted to turn to someone and say it out loud. That is real evidence about what an
          audience might care about, collected for free, and you threw it away because you weren&apos;t recording.
        </p>
        <p>
          Gary Vaynerchuk built a whole approach on this and called it{" "}
          <a
            href="https://garyvaynerchuk.com/creating-content-that-builds-your-personal-brand/"
            target="_blank"
            rel="noopener noreferrer"
          >
            document, don&apos;t create
          </a>
          , meaning capture what you are already doing instead of fabricating something new to perform. The reason
          usually given is that documenting is easier, and it is. But the better reason is that caught material comes
          pre-checked. You are not placing a bet on a stranger. You are handing them a thing that already earned real
          attention once, from you, before there was any camera or any reason to sell it.
        </p>
        <p>
          You can probably see this in your own posts. The ones that did best were often the offhand ones, the thing you
          filmed in ten seconds because it struck you, while the concept you spent a week building landed with a shrug. It
          is tempting to read that as proof that effort does not matter. That is not it. The offhand one worked because it
          started from something real that had already grabbed you. The engineered one started from a guess about what
          might grab someone else.
        </p>

        <h2>Content mode also makes it worse</h2>
        <p>
          There is a second cost. Even when you push through and produce the made-up version, the mode you made it in
          seeps into the video. You produce it, you tidy it up, and somewhere in there you start performing a slightly
          louder version of yourself, so the result carries the faint signal of something built to be watched. Viewers
          feel that signal even when they cannot name it. Asked which content feels authentic, people pick the unpolished
          stuff regular people make over produced, brand-style content by about four to one,{" "}
          <a
            href="https://blog.hubspot.com/marketing/user-generated-content-stats"
            target="_blank"
            rel="noopener noreferrer"
          >
            60 percent to 16 percent
          </a>
          . The rough thirty seconds you caught in the middle of doing the thing can beat the concept you engineered at a
          desk, and part of the reason is just that one of them was real and the other was assembled.
        </p>

        <h2>Leave the camera running on your real life</h2>
        <p>
          The fix is not more ideas. It is shrinking the gap between doing the thing and filming the thing, so the good
          material stops slipping out. In practice that means capturing first and deciding later, instead of deciding
          first and then manufacturing something to fill the decision. When you catch yourself explaining something well,
          turn the phone on and say it again before the words cool off. When the interesting thing happens, film thirty
          rough seconds of it right there and sort it out that night. Most of what you catch will be nothing. That is
          fine. The ones that are something will be things that actually happened, which is the whole advantage.
        </p>
        <p>
          This is also why the good stuff is so easy to lose. The moment is perishable. By the time you are in content
          mode, the thing that made it worth posting has cooled into a flat note that says talk about the friend thing,
          and you cannot get the live version back. So the note becomes one more manufactured post, it does what
          manufactured posts do, and you decide, wrongly, that you have run out of things to say.
        </p>
        <p>
          You have not run out. The idea you keep hunting for at your desk already showed up this week, in the middle of
          an ordinary afternoon, and you let it walk past because you weren&apos;t recording. The change that ends the
          drought is not a better idea or a bigger plan. It is turning the camera on during the part of your life you
          would never have counted as content, because that is where it was the whole time.
        </p>
      </Article>
    </>
  );
}
