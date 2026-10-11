import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-made-it-too-relatable")!;

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
          You told someone a story this week and watched them lean in. It was the exact thing your landlord said, or the
          small dumb detail that made the whole thing funny. Then you sat down to turn it into a video, and somewhere
          between your kitchen and the camera you widened it. You cut the odd specifics so more people could see
          themselves in it. You turned the story into a point. And the version you posted, the one built for everyone,
          did nothing.
        </p>
        <p>
          The advice underneath that move is one of the most repeated things in content, and it sounds obviously right.
          Be relatable. Make it something people can see themselves in. The trouble is what people do to get there.
          Reaching for relatable, they reach for general, and general is the thing nobody remembers.
        </p>

        <h2>Relatable is not the same as general</h2>
        <p>
          Two different things hide under the word relatable, and creators keep aiming at the wrong one. One is reach,
          the idea that the more people a video could apply to, the better it will do. The other is recognition, the jolt
          a single person feels when you describe something true about them. Those two pull in opposite directions. To
          make a video apply to everyone you have to strip out whatever is particular about it, and the particular is the
          exact thing that makes one person feel seen.
        </p>
        <p>
          Think about the last video that actually got you, the one you sent to someone with &quot;this is literally
          me.&quot; It was not vague. It was weirdly specific. It named the exact hour and the exact face you make. It
          felt like it was about you because it was really about the person who made it, in enough detail that you found
          yourself in it. The general version of that same video, the one carefully built to fit everybody, would have
          slid past you without a flicker.
        </p>
        <p>
          Memory works the same way. Concrete, specific things are held far better than abstract ones, partly because a
          concrete detail{" "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/22041121/" target="_blank" rel="noopener noreferrer">
            pulls in more context
          </a>
          , a picture and a place, while a general statement gives the brain almost nothing to grab. So when you sand a
          story down into a lesson everyone can nod at, you are not making it more relatable. You are making it more
          forgettable, trading the one thing a person could hold onto for a smooth surface their attention slides off.
        </p>
        <p>
          There is an old line in advertising that when you make something for everyone, you make it for no one. It
          sounds like a slogan and it happens to be true about attention. The broad version offends no one, and that is
          its problem. There is nothing in it to push against and nothing worth sending to a friend, so it gets a nod and
          vanishes.
        </p>

        <h2>The specific detail is what makes people believe you</h2>
        <p>
          There is a second thing the general version quietly throws away, and it is trust. An oddly specific detail is
          proof you were there. Saying you were anxious is a claim anyone can make. Saying you typed the same message to
          your sister four times and then closed the app without sending it is not something a person invents. The
          specificity is the evidence.
        </p>
        <p>
          Researchers found this in an odd place. Across a set of mock trials, witnesses who dropped in small, trivial
          details, down to what an unrelated person in the shop happened to be buying, were judged{" "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/2724064/" target="_blank" rel="noopener noreferrer">
            more credible
          </a>{" "}
          than witnesses who told the same story without them. The detail proved nothing about the case. It just made the
          person telling it sound like someone who had really been in the room, and that was enough to move how much the
          jury believed.
        </p>
        <p>
          The general video has the opposite problem. Cleaned of anything particular, it reads like it could have come
          from anyone, or from no one, and that is how a viewer files it. Not false, only weightless. A specific is not a
          garnish you add on top of the point. It is often the only reason a stranger believes there is a real person
          behind the point at all.
        </p>

        <h2>The detail has to carry something</h2>
        <p>
          This cuts the other way too, which is where people overcorrect. Told that specifics matter, they start
          sprinkling them on, the humming lights and the blue chair and the coffee going cold, and it reads as set
          dressing. A pile of detail is not the same as the right one. The specific that works is the one carrying the
          actual feeling or the actual point, the detail you could not remove without the story going false. Everything
          else is padding, and padding is usually what people mean when they say a video felt like it was trying too
          hard.
        </p>
        <p>
          There is an easy test. Take the most particular thing in your story, the part you were about to cut for being
          too specific to you, and ask whether that is the part that made your friend laugh or lean in. Most of the time
          it is. That is the load-bearing detail. Keep it, and cut almost everything built around it.
        </p>

        <h2>The part you were about to cut</h2>
        <p>
          Look at what the fear really is. When you flatten a story, you tell yourself you are widening the door so more
          people can walk through. What you are actually doing is stepping back to safety, because a specific detail is a
          small confession and a general statement is not, and the general one cannot embarrass you. The particular thing
          feels risky because it is yours, and that is the same reason it lands.
        </p>
        <p>
          So next time you catch yourself smoothing a story into something everyone can agree with, put one strange true
          detail back. The version you are sure is too specific to matter is usually the one a stranger watches and
          thinks, finally, someone said the exact thing.
        </p>
      </Article>
    </>
  );
}
