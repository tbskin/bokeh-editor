import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-were-one-purchase-away-from-starting")!;

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
          There is a version of your account that starts the day the new camera shows up. You can picture it. Cleaner
          light, footage that finally looks like the people you follow. So you open a few tabs. You compare the two mics,
          read the thread where two strangers argue about lenses, put the thing in a cart and leave it there for a week.
          It feels like work on your videos. It is one of the most reliable ways I know to make none of them.
        </p>
        <p>
          Almost nobody calls this procrastination, because it does not look like procrastination. You are not on the
          couch. You are researching, planning, investing in the craft. But look at what actually came out of the week and
          the honest answer is a full cart and no video.
        </p>

        <h2>A camera can only buy you capability</h2>
        <p>
          A camera cannot do the one thing that counts. It cannot make the video. It can only hand you the ability to make
          a slightly better looking one, and ability is not the part you are short on. The part you are short on is reps,
          the plain stack of posted videos where you find out what you sound like and what a stranger actually stops for.
          No box contains those. You buy them one uncomfortable post at a time, and there is no model you can order that
          lets you skip the line.
        </p>
        <p>
          The proof is in your pocket. 28 Years Later, Danny Boyle&apos;s 75 million dollar horror sequel and{" "}
          <a
            href="https://techcrunch.com/2025/06/22/why-danny-boyle-shot-28-years-later-with-iphones"
            target="_blank"
            rel="noopener noreferrer"
          >
            the biggest film made to date on smartphones
          </a>
          , was shot on adapted iPhone 15 Pro Max cameras. The same phone you would use to film yourself talking already
          shot a movie that played in theaters. Whatever separates your videos from the ones you admire, it is not the
          sensor, and it was never going to be.
        </p>

        <h2>Why buying feels like progress</h2>
        <p>
          So why does shopping for gear feel so much better than making the next clip. Because a purchase gives you
          something practice never does on day one, the clean feeling of having done a thing. Money left your account. A
          box is coming. You can point at it. Practice on day one feels like nothing, or worse than nothing, a clumsy
          video you are not even sure you will post. Between a concrete win you can buy and a vague discomfort you have to
          sit in, people reach for the win.
        </p>
        <p>
          There is a name for the pattern. Photographers and musicians call it{" "}
          <a
            href="https://www.psychologytoday.com/us/blog/ambigamy/201110/gear-acquisition-syndrome-lustily-buying-more-tools-you-need"
            target="_blank"
            rel="noopener noreferrer"
          >
            gear acquisition syndrome
          </a>
          , buying more equipment than the work could ever justify, and the people who write about it are blunt about what
          sits underneath. For beginners especially,{" "}
          <a href="https://www.videoauteur.com/what-is-gear-acquisition-syndrome.html" target="_blank" rel="noopener noreferrer">
            buying new gear feels like a shortcut to professional results
          </a>{" "}
          that skips the vulnerable part, the learning. Perfectionism dresses procrastination up as preparation. It stops
          being avoidance and becomes getting ready, which is the same delay with a nicer word on it.
        </p>

        <h2>A tool removes friction, an alibi comes first</h2>
        <p>
          None of this means gear is a trap and you should shoot on a cracked screen forever. Some purchases are real. The
          way to tell them apart is to ask which came first, the buying or the reps.
        </p>
        <p>
          A tool removes a friction from work you are already doing. If you post every week, and every week the built-in
          mic drags in the whole room and you re-record, the twenty dollar clip mic is a tool. The reps are already there
          and the purchase removes a friction you actually hit. An alibi runs the other way. It is a purchase you put before the
          reps, the condition you set for starting. Once I have the camera I will post properly. Once the lighting is
          sorted I will begin. The tell is that the reps have not started, and the purchase is the thing standing between
          you and starting them.
        </p>
        <p>
          The reason the alibi is so sticky is that it is a precondition you can actually meet. You cannot buy your way to
          being good, but you can absolutely buy a camera, so you can always be busy satisfying the requirement instead of
          doing the thing the requirement was supposedly for. And when the camera arrives and the videos still do not,
          there is a fresh requirement waiting, a lens, or the editing app everyone swears by. The list never runs out,
          because getting met was never its job.
        </p>

        <h2>Set the floor once, and low</h2>
        <p>
          So set the floor a single time and set it low. A phone from the last few years, enough light that a face is not
          a shadow, and sound recorded close to your mouth instead of across the room. That clears the bar for almost
          anything you will make this year. Below it, fix the one specific thing. Above it, no purchase moves your numbers
          for a long while, and the money and the evenings you sink into reaching for one were what the real work needed
          instead.
        </p>
        <p>
          The quiet cost of the upgrade you keep meaning to buy is not the money. It is the months of videos you did not
          make while you were getting ready to make them well. The account that posts with a mediocre camera beats the one
          waiting on a good one, and it is not close, because one of them exists and the other is still in a cart. Make the
          next one on what you have. The camera was never the thing stopping you, and some part of you already knows that,
          which is why buying it felt so much like relief.
        </p>
      </Article>
    </>
  );
}
