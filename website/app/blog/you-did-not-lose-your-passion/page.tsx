import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-did-not-lose-your-passion")!;

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
          You were into it for about three weeks. You posted most days, you thought about it in the shower, you had a
          running list of ideas you could not wait to get to. Then somewhere in the second month the excitement thinned.
          Posting turned into something you had to do instead of something you wanted to do, and one morning you just did
          not open the app. When a friend asked how it was going, you said you had lost the passion for it.
        </p>
        <p>
          That is the story almost everyone tells, and it is almost always the wrong one. You did not lose something you
          had. You were running on a kind of fuel that was never going to last the whole way, because you were promised
          it would, and it was never built for that.
        </p>

        <h2>Nobody warned you the excitement runs out</h2>
        <p>
          The advice you grew up on was simple. Find the thing you are truly passionate about, and the rest takes care of
          itself. Passion, in that story, is a tank you locate once and then run on forever. Pick right and you will
          never have to push yourself, because the wanting will always be there.
        </p>
        <p>
          The catch is that the tank empties. It empties on roughly the same schedule for everyone, a few weeks in, right
          after the newness wears off. That part is normal and nobody tells you it is coming, so when it happens you read
          the empty tank as a verdict on the whole thing. Not the wrong week. The wrong choice.
        </p>
        <p>
          There is research on exactly this. Psychologists Paul O&apos;Keefe, Carol Dweck, and Gregory Walton found that
          people who treat interests as fixed things you discover, rather than things you build, tend to expect that once
          they find the right one{" "}
          <a
            href="https://journals.sagepub.com/doi/abs/10.1177/0956797618780643"
            target="_blank"
            rel="noopener noreferrer"
          >
            their motivation will be nearly boundless
          </a>
          , so they never brace for the hard parts. And when a new interest got difficult, their interest dropped far
          more than it did for people who saw interests as something you develop. The belief itself is what makes the dip
          fatal. If you think real passion is supposed to feel easy, the first stretch where it does not feels like proof
          you picked the wrong thing.
        </p>

        <h2>Passion comes after the work, not before it</h2>
        <p>
          The order in the advice is backwards. You do not find a passion and then do the work. You do the work and, if
          you stay long enough, the interest grows into something that could fairly be called passion.
        </p>
        <p>
          Cal Newport spent a book making this case, and the subtitle says it plainly:{" "}
          <a
            href="https://www.hachettebookgroup.com/titles/cal-newport/so-good-they-cant-ignore-you/9781455509126/"
            target="_blank"
            rel="noopener noreferrer"
          >
            skills trump passion
          </a>
          . Pre-existing passions are rarer than the advice assumes, and the people who genuinely love what they do are
          mostly not the ones who followed a burning interest into it. They are the ones who stuck around long enough to
          get good, and the passion grew out of the competence. The feeling you were told to find first is usually a
          reward for work already done.
        </p>
        <p>
          This is not mysterious once you say it out loud. You get more interested in things you are getting better at,
          because you can suddenly see more in them and the small wins feel good. You also get more attached to things
          you have poured real hours into. Early on you have neither the skill nor the hours, so all you have is the raw
          excitement of a new thing, and raw excitement is the thinnest and shortest-lived interest there is. Building a
          whole run on it was never going to work.
        </p>

        <h2>The boring middle is not a verdict</h2>
        <p>
          So name what the drain actually was. The novelty wore off and the skill had not shown up yet. That gap, after
          the fun of starting and before you are any good, is the least rewarding part of doing anything, and it is
          exactly where the &quot;I lost my passion&quot; story shows up to hand you an exit. The story is appealing
          because it is not your fault. The passion left. You did not quit, it did.
        </p>
        <p>
          The people who look effortlessly obsessed with their thing did not skip this part. They were bored in month two
          the same as you, they just did not treat the boredom as information about whether they belonged. They kept
          posting through the flat stretch, got a little better, and the interest came back deeper than the version that
          ran out. What looks like passion from the outside is mostly that, someone a year past the point where you left.
        </p>
        <p>
          There is a quieter cost to waiting for the one true passion to announce itself. The same research found that
          people who believe interests are fixed are less open to getting into anything outside what already interests
          them. So the search does double damage. It talks you out of the thing you started the moment it stops being
          easy, and it keeps you from catching fire on anything new, because you are holding out for a feeling that is
          supposed to arrive fully formed and rarely does.
        </p>

        <h2>Pick something and stay past the drain</h2>
        <p>
          The move is to stop auditioning your interest and commit to something before you are sure, because being sure
          was never on offer at the start. Pick the thing that is a reasonable bet, the subject you have something to say
          about and would not mind getting good at, and decide you are going to stay past the point where the excitement
          thins. Not forever. Just past the drain, which is the only place you can actually find out.
        </p>
        <p>
          And change what you check. The question is not whether you still feel excited to post today, because most weeks
          you will not, and that was always going to be true. Better questions are whether you are a little sharper than
          you were a month ago, and whether you can still find one thing worth saying this week. Those move slowly, and
          they keep moving long after the first rush is gone. This is a close cousin to{" "}
          <Link href="/blog/you-are-waiting-to-feel-like-it">waiting to feel like it</Link>, except that post is about
          the daily nudge to sit down and make a thing, and this one is about the bigger belief that a whole interest is
          supposed to feel like it on its own.
        </p>
        <p>
          The passion you keep leaving to go find somewhere else was going to grow right where you were standing, a
          couple of months past the day you called it quits.
        </p>
      </Article>
    </>
  );
}
