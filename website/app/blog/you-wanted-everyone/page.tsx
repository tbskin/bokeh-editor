import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-wanted-everyone")!;

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
          Everyone is chasing a bigger number. More views, a bigger following. It is the one thing every piece of advice
          agrees on and the one thing the app puts in front of you the moment you open it. So here is a smaller question,
          and a harder one. If you stopped posting tomorrow, would anyone actually notice.
        </p>
        <p>
          Most of us never ask it, because the number on the screen answers a friendlier question instead. It tells you
          how many people you reached. It says nothing about whether a single one of them would care if you were gone.
          Those are two different things, and almost all the growth advice you have ever read lives on the easy side of
          the gap.
        </p>

        <h2>The number you watch answers the wrong question</h2>
        <p>
          Views measure how many people the feed decided to show you to. That is mostly the platform&apos;s call, not a
          verdict on whether anyone wanted you there. A video can do fifty thousand views and leave nothing behind,
          watched on the way to something else and forgotten before the next one loads. The count went up. Nothing got
          built.
        </p>
        <p>
          There is a better question, and it comes from an odd place. Years ago Sean Ellis was trying to work out which
          young companies actually had something and which were just growing on fumes, and he stopped asking people
          whether they liked the product. He asked{" "}
          <a href="https://learningloop.io/glossary/sean-ellis-score" target="_blank" rel="noopener noreferrer">
            how they would feel if they could no longer use it
          </a>
          . When at least 40 percent said they would be very disappointed to lose it, the company almost always had real
          traction. Below that line, growth stayed a grind no matter how many people signed up. Now swap the product for
          you. The honest measure of your work is not how many watched. It is how many would be disappointed if you
          stopped.
        </p>

        <h2>A few who would miss you beats a crowd who will not</h2>
        <p>
          The instinct pushes the other way. A hundred people who love you sounds sweet and small. A million who kind of
          like you sounds like a career. When Paul Graham was advising Airbnb in its early, going-nowhere days, he told
          the founders the opposite, and Brian Chesky says the line changed the company. Better to have{" "}
          <a
            href="https://www.cnbc.com/2023/05/24/airbnb-ceo-brian-chesky-heres-the-best-piece-of-advice-i-ever-got.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            a hundred people who love you than a million who kind of like you
          </a>
          .
        </p>
        <p>
          The reason is not sentimental. Chesky&apos;s own version of it goes like this. A hundred people who love what
          you make will each go tell a few more, and that is how the thing actually spreads. The crowd who kind of likes
          you tells no one, because they already forgot you existed. So the small loyal group is not the cozy
          consolation prize you settle for instead of reach. It is where reach comes from in the first place. The people
          who love it are the ones who go and get you the next people.
        </p>

        <h2>Building for everyone is how you reach no one</h2>
        <p>
          This is why aiming at everyone quietly backfires. To be for everyone, a video has to lose whatever might rub a
          particular person the wrong way, so you reach for the safe topic and the take no one would argue with, the
          version that could have come from anybody. It clears a low bar with a lot of people and a high bar with none of
          them. Nobody dislikes it. Nobody would miss it either. (This is close to why chasing &quot;relatable&quot;
          makes content blander, which I got into in{" "}
          <Link href="/blog/you-made-it-too-relatable">you made it too relatable</Link>. The difference is that this is
          about who you build for, not how you tell one story.)
        </p>
        <p>
          Kevin Kelly put a floor under this a long time ago in an essay called{" "}
          <a href="https://kk.org/thetechnium/1000-true-fans/" target="_blank" rel="noopener noreferrer">
            1,000 True Fans
          </a>
          , the idea being that you never needed a mass audience, only a modest number of people who would show up for
          anything you made. Li Jin later argued the real number might be{" "}
          <a href="https://a16z.com/1000-true-fans-try-100/" target="_blank" rel="noopener noreferrer">
            closer to 100
          </a>
          . The exact figure is not the point. The shape is. A small group who genuinely care is something you can build
          on. A big group who do not is a number that feels good on the screen and does nothing the next time you post.
        </p>

        <h2>A crowd that does not care will steer you wrong</h2>
        <p>
          The big indifferent number has a second cost, past the fact that it does not spread. It talks back. The people
          most likely to leave a quick reaction on a post the feed pushed out to strangers are the most casual people in
          the room, the ones passing through. If you read those reactions as your feedback, and it is hard not to, you
          slowly tune the work toward whoever is easiest to please in the first second of a scroll. You end up making it
          for the people who were always going to leave, and a little less for the ones who might have stayed.
        </p>

        <h2>How to tell if you are being missed</h2>
        <p>
          You can usually see which one you have if you look past the top-line count. Being missed shows up in
          specifics. Someone comments like they already know you. Another asks when the next one is coming, or sends it
          to one particular friend with a note attached. The same names turn up on the second and third post, not only
          the one the feed happened to push. None of that moves the view counter much, and all of it is worth more than a
          spike of strangers who came once and left.
        </p>
        <p>
          So make the next thing for the person who already left a real comment, not for the stranger you are hoping the
          algorithm finds. The screen will always tempt you to go wider, because wider is the number it keeps showing
          you. But the thing that actually predicts whether you are still doing this a year from now is not how many
          people you reached. It is whether, on the day you go quiet, one person notices you stopped.
        </p>
      </Article>
    </>
  );
}
