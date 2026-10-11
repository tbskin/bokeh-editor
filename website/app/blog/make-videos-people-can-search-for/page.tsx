import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("make-videos-people-can-search-for")!;

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
          You make something you are actually proud of. A clean point, said well. It goes out, does okay for a day, maybe
          gets a few shares, and then it slides under the next thing and is gone. A week later the only person who can
          still find it is you. You tell yourself it was the algorithm, or timing, or luck.
        </p>
        <p>
          It usually was not any of those. The reason is quieter, and more fixable. That video could only ever be found
          one way, by someone who happened to be scrolling past on the day you posted it. You built it with a single
          door, and the day the feed stopped showing it, the door closed.
        </p>
        <p>There is another way people find video now, and most creators are not building for it.</p>

        <h2>People do not only scroll. They look.</h2>
        <p>
          A short video can reach someone two ways. Someone trips over it in the feed, or someone goes looking for it
          because they have a question. Everyone optimizes for the first one. Hook them fast, keep the cut moving, win the
          first second. Real, and worth doing. But it is only one of the two doors, and it is the one that shuts after a
          day.
        </p>
        <p>
          The second door is search, and it gets more traffic than creators think. A Google executive said internal
          research found that almost 40 percent of US users aged 18 to 24{" "}
          <a
            href="https://techcrunch.com/2022/07/12/google-exec-suggests-instagram-and-tiktok-are-eating-into-googles-core-products-search-and-maps/"
            target="_blank"
            rel="noopener noreferrer"
          >
            went to TikTok or Instagram instead of Google
          </a>{" "}
          when they wanted somewhere to eat. Adobe&apos;s 2026 survey found that{" "}
          <a
            href="https://www.adobe.com/express/learn/blog/using-tiktok-as-a-search-engine"
            target="_blank"
            rel="noopener noreferrer"
          >
            49 percent of people had used TikTok as a search engine
          </a>
          , up from 41 percent two years earlier. Google still wins most searches. That is not the point. The point is
          that for a growing set of questions, people would rather watch a person answer than read a page, and they go
          looking for that video on purpose.
        </p>
        <p>
          That viewer does not show up bored. They show up with a problem. And a video that answers a real problem gets
          found again next week, and the week after, by every new person who types the same thing.
        </p>

        <h2>Built for the feed means built to expire</h2>
        <p>
          This is why so many good videos die young. They were made to interrupt someone today, not to answer someone
          later. The planning is all about the moment. What is trending, what sound is moving, what will get a little heat
          this afternoon. The video works, but only as a moment. Nothing in it lines up with a question someone will have
          next month, so no one finds it next month.
        </p>
        <p>
          You can see it in the archives that look busy and do nothing. Hundreds of clips, almost no answers. Plenty of
          proof that someone was online. Then a stranger arrives with a real question and the archive has nothing for
          them, because none of it was made to be found on purpose.
        </p>

        <h2>A searchable video starts with the sentence in someone&apos;s head</h2>
        <p>
          The trap is to hear the word search and start thinking like a marketer. Keywords, captions, optimization. Do
          that and the video gets worse, because it stops sounding like a person and starts sounding like a help article
          read into a camera.
        </p>
        <p>
          The better move is more human than that. Start with the question already in someone&apos;s head. Why do my
          apartment videos look gray. What do I wear to an outdoor wedding when it is a hundred degrees. Where do I sit in
          this place if I hate noise. Those are not topics. They are complaints, worded the way a real person would type
          them. Build the video to answer one, say the problem plainly at the top, pay it off without wandering, and put
          the words a person would actually search into the caption instead of the clever category you would use in a
          deck.
        </p>
        <p>
          None of that costs you any taste. The video can still be funny, still look like you, still have a point of view.
          It just has a job now, and the job is what lets it get found twice.
        </p>
        <p>
          The platforms are already moving this way. TikTok will tell you{" "}
          <a
            href="https://ads.tiktok.com/business/en-US/blog/introducing-search-ads-campaign"
            target="_blank"
            rel="noopener noreferrer"
          >
            57 percent of its users search on the app
          </a>
          , and it now sells ads against those searches, which is a company betting real money that people arrive with
          questions. Google has been caught{" "}
          <a
            href="https://searchengineland.com/google-showing-tiktok-videos-in-sge-featured-snippets-437074"
            target="_blank"
            rel="noopener noreferrer"
          >
            pulling TikTok clips straight into its own results
          </a>
          , sometimes quoting the caption as the answer. The words around your video stopped being decoration. They are
          how the right person finds it later.
        </p>

        <h2>Ask who comes looking</h2>
        <p>
          This is not a case for making everything evergreen. Some posts should burn hot and vanish. Jokes, reactions, a
          loose thought, proof that a person is there. Keep making those. The problem is making only those, because then
          your whole body of work has a shelf life of about a day.
        </p>
        <p>
          So before you post, ask one more thing on top of &quot;will this stop the scroll.&quot; Ask who would go
          looking for this a month from now, and what they would type to find it. If you can name that person and those
          words, make it easy for them to land on you. If you cannot, that is fine, as long as you know you are making a
          spark and not something built to last.
        </p>
        <p>
          The feed gives a video its first day. Search is what can give it the next hundred. Build for only the first, and
          you will keep reading &quot;it disappeared&quot; as &quot;it failed.&quot; Build for both, and the work you
          already did stops vanishing behind you and starts bringing people to you.
        </p>
      </Article>
    </>
  );
}
