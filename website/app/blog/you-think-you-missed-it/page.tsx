import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-think-you-missed-it")!;

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
          Ask people why they never started posting and the first answers are the practical ones. They are busy. They do
          not like how they sound on camera. They tell themselves they have no ideas. All real, all fixable, and none of
          them the thing that actually holds them there. Push a little past the polite answers and you usually reach the
          same quiet place. It feels too late. The good spots are gone. Everyone worth watching already got there years
          ago, and you are walking into a party that already ended.
        </p>
        <p>
          That feeling is real, and it is almost always wrong, and it is wrong in a way worth understanding, because it
          is not a read on the market. It is a trick your memory plays, and it has been playing the same trick, on a
          fresh batch of people, in every single year.
        </p>

        <h2>The good era is always the one that just ended</h2>
        <p>
          Someone said it was too late to start on YouTube in 2014. They said it in 2018, when the early vloggers were
          already famous and the numbers looked impossible to catch. They said it in 2022, and in 2025, and they will
          say it about this exact month a couple of years from now, from the mouth of someone looking back and wishing
          they had the clean runway you are standing on today. The good era is never where you are. It sits a few years
          behind you, in a stretch of time that felt just as crowded and just as late to the people who were actually
          living in it.
        </p>
        <p>
          That is the first thing that should make you suspicious. If every year is too late, and every year some new
          person starts anyway and it works, then too late is not really describing the year. It is describing a feeling
          that shows up no matter what year it is. The creators you envy heard the same sentence when they began. Most of
          them came close to believing it.
        </p>

        <h2>It is a memory trick, not a market read</h2>
        <p>
          There is a name for this. Declinism, the steady sense that things used to be better and are quietly getting
          worse, and it is one of the most reliable biases we have. When a behavioral scientist at Warwick Business
          School looked at{" "}
          <a
            href="https://www.wbs.ac.uk/news/why-we-think-life-was-better-in-the-good-old-days/"
            target="_blank"
            rel="noopener noreferrer"
          >
            why we think life was better in the good old days
          </a>
          , he found that people rate past experiences as far rosier looking back than they rated them while they were
          happening, and that our habit of feeling losses more than gains leaves us reading the present as a slow slide
          downhill. Ask people flat out and it shows up cold. In one YouGov poll, 70 percent of Britons said the world is
          getting worse and fewer than 10 percent said it is getting better.
        </p>
        <p>
          So the belief that your moment showed up a few years too late is not a private insight about your niche. It is
          the default setting of the human mind, pointed at your camera roll. Almost everyone feels they arrived right
          after the good part. A feeling that common cannot tell you anything about whether it is actually true for you.
        </p>

        <h2>Nobody who was early felt early</h2>
        <p>
          Here is what the too-late story gets backwards. It pictures the early ones arriving at an empty room, planting
          a flag, and walking to the front while it was easy. That is not how it felt to them. From the inside, early
          looks exactly like now. They looked at the people already ahead of them, decided the good spots were taken, and
          posted anyway into what felt like a crowd. Nobody gets the view from the future where their own timing looks
          obvious and lucky. They just start, in a moment that feels late, the way every moment does.
        </p>
        <p>
          And the thing that decides whether you get watched has almost nothing to do with the year on the calendar. It
          comes down to one stranger giving you fifteen seconds and choosing to stay. That trade works the same in 2026
          as it did in 2016, except there are more strangers around now than there have ever been. YouTube is past{" "}
          <a href="https://sqmagazine.co.uk/youtube-vs-tiktok-statistics/" target="_blank" rel="noopener noreferrer">
            2.8 billion people a month
          </a>
          , and TikTok is{" "}
          <a href="https://buffer.com/resources/tiktok-statistics/" target="_blank" rel="noopener noreferrer">
            still adding users
          </a>
          , not running low on them. People still walk on from nothing and take off fast, too. A guy posting deadpan fake
          fight challenges{" "}
          <a href="https://creatordb.app/blog/how-chrogman-went-viral-on-instagram/" target="_blank" rel="noopener noreferrer">
            went from zero to nearly a million followers in under three months
          </a>{" "}
          last year, on a platform everybody agrees is saturated.
        </p>

        <h2>What being too late is actually protecting you from</h2>
        <p>
          If it were only a mistake, it would be easy to put down. It sticks because it is useful. Too late is the one
          reason for not starting that is not your fault. It is not that you are scared, or that you might be bad at it,
          or that you are not sure you have anything anyone wants. It is that the window shut before you got here, which
          is nobody&apos;s failing and certainly not yours. That is a comfortable spot to stand, and it asks nothing of
          you.
        </p>
        <p>
          The tell is how it feels when you decide it. A door that really closed is a disappointment. This one lands as
          relief, a small quiet exhale, because it lets you off a hook you were dreading anyway. That relief is the sign
          you have found an excuse you can live with, not a fact you discovered.
        </p>
        <p>
          The people who started did not catch the market at some kinder hour than the one you are in now. They just
          refused to trust the part of themselves that said it was too late, on a day that felt every bit as late as
          today does. In a couple of years, someone is going to look back at right now and wish they had your timing. You
          are the early they will envy. The only way to genuinely miss it is to keep waiting until that story comes true.
        </p>
      </Article>
    </>
  );
}
