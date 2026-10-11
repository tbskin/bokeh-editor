import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-asked-it-what-to-make")!;

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
          You are stuck on what to post. So you open the chatbot and type some version of give me ten video ideas about
          my thing. It gives you ten. They are not bad. A couple even sound decent. You pick one, make it, put it up, and
          it lands like a stone. No reach, a like from a friend, the usual quiet. You decide the idea just was not strong
          enough, and you go back and ask for ten more.
        </p>
        <p>
          The problem was not that the machine handed you a weak idea. It handed you a perfectly reasonable one. The
          problem is what reasonable means to a machine that works by guessing what comes next. It gives you the most
          likely idea, and the most likely idea is the one a lot of other people already had.
        </p>

        <h2>What you actually asked for</h2>
        <p>
          A language model is a very good guess about what usually follows what. Ask it for a video idea about your
          subject and it does the thing it is built to do. It finds the middle of everything that has ever been said
          about that subject and hands it back, tidied up and sounding sure of itself. That is not the tool failing. That
          is the tool working exactly as designed.
        </p>
        <p>
          The catch is that getting watched is a fight against the middle. The feed is already full, and the one thing it
          has no use for is a video that looks like fifty others. You went to the one thing in the room that only knows
          the average, asked it what to make, and then carried the average into the one place that punishes it.
        </p>
        <p>
          You are also not alone in doing this. Coming up with ideas is now the most common thing people reach for AI to
          do in their content work, ahead of writing the thing or editing it (
          <a href="https://blog.hubspot.com/marketing/ai-in-content-marketing" target="_blank" rel="noopener noreferrer">
            HubSpot
          </a>
          ). So the move that feels like getting ahead is the same move a few hundred thousand other people are making
          this week, all pointed at the same model, all getting back the same shape of answer.
        </p>

        <h2>Everyone gets a better idea and the same idea</h2>
        <p>
          There is good research on what happens next, and it is more careful than AI is good or AI is bad. Researchers
          at UCL had people write short stories, some of them handed a story idea from an AI first and some working on
          their own, then had readers rate the results. The stories written with AI help scored as more creative and more
          enjoyable, and the lift was biggest for the people who were not strong writers to begin with. That part is real,
          and worth saying plainly.
        </p>
        <p>
          But when the researchers stepped back and compared all the stories to each other, the ones written with AI were
          noticeably more alike than the ones people wrote alone (
          <a href="https://www.science.org/doi/10.1126/sciadv.adn5290" target="_blank" rel="noopener noreferrer">
            Science Advances
          </a>
          ). Each writer came out ahead. The group came out more identical. A second study, from a creativity lab, found
          the same pattern when people brainstormed instead of wrote. Different people using ChatGPT produced ideas that
          overlapped far more from one person to the next than the ideas people came up with other ways (
          <a href="https://arxiv.org/abs/2402.01536" target="_blank" rel="noopener noreferrer">
            Creativity and Cognition 2024
          </a>
          ).
        </p>
        <p>
          Sit with what that means for you. You are not just getting an average idea. You are getting the same average
          idea as the next person who opened the same app and typed almost the same thing an hour later. You went looking
          for a way to stand out faster, and you found a machine whose whole nature is to blend things in.
        </p>

        <h2>Why the full list feels like progress</h2>
        <p>
          The reason this is so easy to do is that it feels like progress. A blank note is uncomfortable. Ten ideas on
          the screen is a relief, a small hit of having done something. But the thing you did was skip the actual hard
          part, which was deciding, and the relief is the tell. You traded the discomfort of a blank page for the comfort
          of a full one, and the full one was full of everyone else&apos;s answers.
        </p>
        <p>
          You can feel it in the ideas themselves once you look. Say you refinish old furniture. Ask a model and you will
          get five tips for beginners, or a satisfying before and after. Fine ideas, made ten thousand times already. The
          video only you could make is the piece a client asked you to save because it was her grandmother&apos;s, and
          the hour you stood there deciding whether to sand out a scratch that was probably left by a kid. A model will
          never suggest that one, because it does not know it happened.
        </p>

        <h2>The part it was never going to give you</h2>
        <p>
          What makes a video get watched is almost never the topic. It is the specific angle on the topic that could only
          have come from you. It is the reason you actually believe the thing, or the example you reach for because it
          happened to you, or the opinion you are a little nervous to say because someone might argue back. None of that
          is the most likely next thing to say. All of it is exactly what a prediction machine files off, because by its
          nature it is the unusual part, and the unusual part is what the machine exists to round away.
        </p>
        <p>
          So you had the whole thing backwards. You gave away the one piece of the work that was yours, the deciding, and
          kept the piece that anyone or anything can do. Choosing what to make and knowing what you think about it is not
          the warm-up to the job. It is the job. It is the only part a stranger scrolling past will ever actually feel.
          The rest is labor.
        </p>
        <p>
          None of this means never touch the tool. Point it at the labor. Let it clean up a clumsy sentence or take the
          parts that were never really you, and keep the deciding for yourself. The cousin of this mistake is handing the
          machine your own rough writing to smooth over, which sands the person right off your words, and I get into that
          in <Link href="/blog/you-made-it-sound-better">you made it sound better</Link>. This is the step before it, the
          deciding, and it matters more. The test fits in one line. If you would be embarrassed to admit that nobody
          actually chose this, you handed over the wrong half.
        </p>
        <p>
          You did not run out of ideas the day you started asking a machine for them. You handed the question to the one
          voice in the room that can only ever answer for everybody at once. The idea you were hunting for was the exact
          one it could not give you, because it did not know that the person asking was you.
        </p>
      </Article>
    </>
  );
}
