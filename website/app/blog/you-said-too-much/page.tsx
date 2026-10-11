import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-said-too-much")!;

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
          You had one small thing to say. A single sharp observation you could have gotten out in twenty seconds. Then
          you sat down to make it, and somewhere between the idea and the record button you decided one point was not
          enough for a whole video. So you added a second point, and a third, and a little setup up front so it would not
          feel thin. What could have been a clean twenty seconds became ninety that sag in the middle. You watched it
          back, felt the drag, and could not quite say what went wrong.
        </p>
        <p>
          Nothing went wrong in the edit. The video was overloaded before you filmed it. And the instinct that overloaded
          it is the one everyone praises, the urge to make the video count by putting everything you know into it. That
          instinct is quietly making your videos worse and your week harder, and it grows out of a belief that is wrong
          in a way worth seeing clearly.
        </p>

        <h2>A video can only hold one thing</h2>
        <p>
          Watch how a person actually watches. They land on your video mid-scroll with no patience and one silent
          question, what is this about. A video with one point answers that in the first couple of seconds and spends the
          rest paying it off. A video with three points never answers it, because it is about three things, which from
          the outside looks like it is about nothing in particular. The viewer cannot find the thread, so they go, and
          they tend to go right in the middle, where you crammed the second idea.
        </p>
        <p>
          There is a plainer version of this too. Every extra point steals room from the others. A short video has a
          fixed amount of attention to spend, and splitting it four ways means no single idea gets enough to land. This
          is not a hot take. It is the boring line buried in every production guide, that{" "}
          <a
            href="https://sproutvideo.com/blog/maximize-investment-video-production.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            cramming all your talking points into one video dilutes each message
          </a>
          . It stays buried because it feels wrong to follow. Saying one thing feels like underdelivering. And the
          numbers lean the same way the advice does, since the shorter and tighter the video, the more of it people
          actually finish, with{" "}
          <a href="https://techrt.com/short-vs-long-video-statistics/" target="_blank" rel="noopener noreferrer">
            clips under a minute watched to the end far more often than longer ones
          </a>
          . One clean point is short by nature. Five points bolted together is not.
        </p>
        <p>
          None of this is really about length. A ten minute video that answers one question is still one video, and it
          can hold someone the whole way if the single thread is strong enough. The problem was never that your video ran
          long. It was that it ran plural. Four subjects in forty seconds is four videos crowded into one, and a viewer
          feels the crowding even when they could not tell you what caused it.
        </p>

        <h2>Why you keep overstuffing it</h2>
        <p>
          So why do it, when some part of you can feel the video getting heavier with every point you add. The honest
          answer is that one point feels too small to post. You picture yourself making a video that says a single thing
          and it feels slight, a little embarrassing, like you are taking up people&apos;s time with something that barely
          qualifies. So you pad it. The extra points are not there for the viewer. They are there for you, so the video
          feels big enough to have been worth making.
        </p>
        <p>
          It is the same move as clearing your throat before you talk, a way to buy yourself permission to take up the
          space. But the viewer never asked for permission-sized value. They asked for one good thing, clearly said. The
          padding you added so you would feel less exposed is the exact thing burying the point you were actually proud
          of.
        </p>

        <h2>The empty idea list is the same fear</h2>
        <p>
          Here is where it gets expensive. That belief, that one point is too small, does not only bloat the videos you
          make. It empties the list of videos you could make.
        </p>
        <p>
          Open your notes and look at how the ideas are written down. They are almost always too big. Not observations,
          topics. How to grow on Instagram. What I learned starting a business. My morning routine. Each one reads like a
          huge project, a video you would need a free afternoon and a lot of nerve to pull off, so you keep not making
          it, and the list sits there looking full and feeling empty.
        </p>
        <p>
          But that topic was never one video. How to grow on Instagram is thirty videos, one for each specific thing you
          actually know, most of them a sentence long. You did not run out of ideas. You glued thirty of them into a lump
          that is too big to make and too crowded to watch, because each one on its own felt too slight to count. The dry
          list and the bloated video come from the same wrong belief, met at two different moments.
        </p>

        <h2>Say the one thing</h2>
        <p>
          The fix is almost too plain to trust. Pick the single sharpest point and make only that. Cut everything that is
          not it, including the setup you were sure people needed. They did not need it. They needed the one thing, said
          like you meant it.
        </p>
        <p>
          There is a test that catches this before you film. Say out loud what the video is about, in one sentence. If it
          takes you two, or the word and shows up in the middle doing real work, you are holding two videos. That is not
          a problem to solve. That is one more than you thought you had this morning, and if you keep splitting instead
          of gluing, one honest topic turns into a week of posts you can film in a single sitting.
        </p>
        <p>
          The small idea you keep deciding is not enough is usually the whole video. It was ready before you started
          adding to it.
        </p>
      </Article>
    </>
  );
}
