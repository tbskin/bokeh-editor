import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("stop-saving-your-best-ideas")!;

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
          You have an idea you have been carrying around for months. The good one. The one you feel a little proud of
          before you have even made it. And every week you post something smaller instead, and tell yourself you will do
          the big one when the moment is right, when you have a bigger audience and can finally pull it off properly.
        </p>
        <p>
          So it waits. Not because you forgot it. You are protecting it. You are saving your best idea for later, and the
          saving is the quiet thing keeping you where you are.
        </p>

        <h2>You think you are running low</h2>
        <p>
          There is a feeling underneath the hoarding worth saying out loud. Ideas feel scarce. You have a few good ones
          and a lot of filler, and spending a good one feels like paying the rent with money you were putting aside for
          something real. So you ration. You post the okay idea and keep the strong one in reserve, in case nothing this
          good ever shows up again. I will do that one when I hit ten thousand followers. I do not want to waste it on a
          small account.
        </p>
        <p>
          That feeling is real, and it is also wrong. When researchers sat people down to generate ideas, everyone
          expected their own output to start strong and trail off toward nothing. It did not. The ideas held steady, and
          often the later ones were the better ones. The researchers named this the{" "}
          <a href="https://www.pnas.org/doi/10.1073/pnas.2005620117" target="_blank" rel="noopener noreferrer">
            creative cliff illusion
          </a>
          , the belief that you are about to run dry right at the point where you are usually still going. The reserve
          you are guarding so carefully is deeper than it feels from the inside.
        </p>

        <h2>You are auditioning with your second-best work</h2>
        <p>
          Now look at what the rationing does. You are keeping the best idea for a bigger audience. Fair enough. Where is
          that bigger audience supposed to come from? From the videos you post. Which, right now, are your weaker ones,
          because the strong one is sitting in the drawer.
        </p>
        <p>
          So the order is backwards. Your second-best work goes to the small audience you already have, and your best
          work waits for the large audience you do not have yet, when the best work is the exact thing that would have
          built it. You grow on the stuff you were willing to part with, and hold back the stuff that would move people,
          saving it for a room that only fills up if you spend it. The good idea is not a prize you hand people
          once they arrive. It is the reason they show up.
        </p>
        <p>
          And the small audience you are so worried about wasting it on is the most forgiving one you will ever have. A
          strong idea landing in a small, warm room does more than you think, and it is the cheapest place on earth to
          test the big swing. The version of you with a hundred thousand followers does not get to try things quietly
          anymore. You do, right now, and you are choosing not to.
        </p>

        <h2>The right moment does not send a signal</h2>
        <p>
          There is a second reason the idea stays in reserve, and it is less flattering than strategy. Your best idea is
          usually the most you. It is the thing you actually believe, the take that would sting the most if people
          scrolled straight past it. A small idea is safe, because a shrug costs nothing. The big one carries the risk of
          a real no.
        </p>
        <p>
          So waiting for the right moment starts to look like what it is. The right moment never announces itself. There
          is no week where you wake up ready, and the audience is exactly big enough, and the idea is guaranteed to land.
          Waiting for that week is not patience. It is a way of never having to find out. And the longer the idea sits,
          the larger it grows in your head, until no version you could actually make would match the one you have been
          protecting, which becomes one more reason to leave it where it is.
        </p>
        <p>
          Some ideas genuinely need a skill you do not have yet, and a few are worth holding for a reason you could
          explain out loud. But that is a small number. Most good ideas do not sit unmade because the timing is wrong.
          They sit because posting them feels like too much to risk this week, and that never changes on its own.
        </p>

        <h2>Spending is how you get more</h2>
        <p>
          Here is the part the hoarding gets exactly wrong. You do not find your next great idea by saving this one. You
          find it by making things. People who produce a lot of work have more of their best work too, for the plain
          reason that the{" "}
          <a href="https://jamesclear.com/equal-odds" target="_blank" rel="noopener noreferrer">
            good ones come out of the volume
          </a>
          , roughly in step with how much you make. Nobody rations their way to a good idea. They make their way there.
        </p>
        <p>
          So the idea you are saving is not a rare coin you get to spend once. It is proof you can have them. Post it, and
          you are not one idea poorer. You are one made thing wiser about what actually lands, with the next idea already
          forming out of the work. Sit on it, and you keep it safe and learn nothing, and a year from now you have the
          same untested idea and the same small room you were trying to grow out of.
        </p>
        <p>
          Post the one you have been saving. Not when you are ready, because the audience you keep saving it for is on
          the other side of posting it.
        </p>
      </Article>
    </>
  );
}
