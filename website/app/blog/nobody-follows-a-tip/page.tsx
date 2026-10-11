import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("nobody-follows-a-tip")!;

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
          You post something genuinely useful. A real tip, the kind you wish someone had handed you two years ago. It
          does well. People save it, a couple of friends send it around, and then you look at your follower count and it
          has not moved. So you decide the next tip needs to be sharper. It almost never does. The problem was never the
          tip. It is that a tip is one of the easiest things in the world to take and then walk away from.
        </p>
        <p>
          Useful content gets watched. It does not get you followed, and it turns out those are two different jobs. You
          can be the most helpful account in your corner of the app and still be a stranger to every person you helped.
        </p>

        <h2>A tip is complete without you</h2>
        <p>
          A good tip answers a question and closes it. Someone showed up with a problem, got the fix, and now they are
          done. There is no reason to come back, because you already gave them the whole thing. Saves feel like a win,
          and they are a fine signal, but a save is a bookmark. It is a plan to use the information later, not a decision
          to care about the person who posted it. Most people&apos;s saved folders are full of clips from accounts they
          could not name if you asked.
        </p>
        <p>
          The value lives in the tip, not in you. That is the quiet problem with building everything on usefulness. You
          spend your time handing out things that work perfectly well without you attached to them.
        </p>

        <h2>People follow a person, not a fact</h2>
        <p>
          Look at what a follow actually is. It is someone deciding they want more of what you specifically make. Not
          more tips in general, they can get those anywhere, but more of you. In Deloitte&apos;s 2025 Digital Media
          Trends survey, about 52 percent of Gen Z said they feel{" "}
          <a
            href="https://www.hollywoodreporter.com/business/business-news/deloitte-gen-z-creator-content-streaming-price-1236171227/"
            target="_blank"
            rel="noopener noreferrer"
          >
            a stronger personal connection to social media creators
          </a>{" "}
          than to the actors and personalities they grew up watching on TV. That is what a follow runs on. People end up
          following a person, and the tips were just how they found them in the first place.
        </p>
        <p>
          A folder of good advice does not create that. A person does. Someone can find your tips genuinely helpful and
          feel nothing at all about you, and nothing is not enough to make them tap follow.
        </p>

        <h2>The better the tip, the easier it leaves</h2>
        <p>
          Here is the part that stings. The cleaner and more useful a tip is, the more portable it is, which means the
          easier it travels without you. A sharp, self-contained tip is exactly the kind of thing a bigger account
          screenshots or reposts with your handle cropped off. You did the work of figuring it out. The tip gets the
          credit, and the tip does not carry your name.
        </p>
        <p>
          So you can pour everything into being as helpful as possible and end up building a library that helps the whole
          app and belongs to no one. The usefulness comes loose from you and floats off on its own. You taught a thousand
          people something and not one of them can remember where they learned it.
        </p>

        <h2>Why we reach for tips anyway</h2>
        <p>
          There is a reason people who actually know their subject retreat into pure how-to. A tip is safe. It is
          checkable. If you say do this and it works, nobody can argue with you. An opinion is different. It can be wrong,
          it can be pushed back on, and putting one out loud feels like sticking your neck out in a way that reciting a
          fact never does.
        </p>
        <p>
          But the neck you will not stick out is usually the exact thing that would make you worth following. The take,
          the preference, the way you do it differently from everyone else in your niche. Playing it safe with clean,
          agreeable information is a big part of why so many knowledgeable accounts stay invisible. They are helpful and
          completely forgettable, and they cannot understand why.
        </p>

        <h2>Attach what you know to who you are</h2>
        <p>
          The fix is not to be less useful. Keep the tip. The move is to make it hard to copy by wrapping it in the part
          that is only yours. The reason you do it this way instead of the way everyone teaches it, and the common advice
          you have quietly stopped believing.
        </p>
        <p>
          Picture two versions of the same video. One says here are three ways to fix bad lighting. The other says
          everyone tells you to buy a ring light, and I think that is why so much of this stuff looks fake, so here is
          what I do instead. Same information underneath. The second one has a person in it. The first one you forget by
          the next swipe. The second one you follow, because now you want to know what else they think.
        </p>
        <p>
          The information you can get anywhere. The taste behind it, which tips you trust and which ones you have thrown
          out and why, only comes from you. That is the part worth putting your name on.
        </p>
        <p>
          So the goal was never to be the most helpful account in the room. Helpful is common, and it is easy to leave.
          The goal is to be the one people cannot get the same thing from anywhere else, and that almost always means
          letting more of yourself into the work you have been keeping so clean and professional. Give the tip. Then give
          the reason you believe it. The tip is what people watch. You are the reason they come back.
        </p>
      </Article>
    </>
  );
}
