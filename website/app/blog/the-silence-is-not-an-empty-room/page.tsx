import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("the-silence-is-not-an-empty-room")!;

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
          You post something and check back an hour later. Two thousand plays, seven likes, no comments. You do the
          quiet math everyone does, a lot of views and almost no response, and you file the video under nobody cared.
          Then you make the next one a little safer, because that is what people do when a room goes quiet on them.
        </p>
        <p>
          The quiet is not the room saying no. It is roughly what a room full of people watching sounds like. The
          mistake is reading silence as an empty room, when silence is the ordinary behavior of an audience, and almost
          everyone you reach will never make a sound.
        </p>

        <h2>Watching is a silent act</h2>
        <p>
          Most people who see your video do the thing people mostly do online, which is nothing visible. They watch,
          maybe half of it, and keep scrolling. The rule of thumb people have leaned on for years is 90-9-1: about
          ninety of every hundred just watch, nine react a little, and one does most of the talking.{" "}
          <a
            href="https://www.nngroup.com/articles/participation-inequality/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jakob Nielsen called it participation inequality
          </a>
          . It is a heuristic and the exact split moves around by platform, but the shape holds everywhere you look.
          Watching is the default. Reacting takes a reason.
        </p>
        <p>
          So when you stare at a like count and read it as did anyone care, you are measuring care with the wrong tool.
          A like is not care. It is care plus the small extra nudge it takes to actually tap. The average Reel gets a
          visible reaction from{" "}
          <a href="https://sproutsocial.com/insights/instagram-stats/" target="_blank" rel="noopener noreferrer">
            somewhere around one viewer in a hundred
          </a>
          . The other ninety-nine did not hate it. They did the default thing, which is to watch and say nothing, the
          same thing you do all day on your own feed.
        </p>

        <h2>The people who speak are not a sample</h2>
        <p>
          The few who do speak become the only voices you can hear, so they quietly start to feel like the audience.
          They are not. They are the outliers, the one in a hundred who had a reaction strong enough to type it out. Tune
          your next video to them and you are shaping the work around the least representative slice of the people
          actually watching. You end up making it for the commenter instead of the ninety who stayed quiet and stayed to
          the end.
        </p>
        <p>
          The ones who comment also tend to pull in one direction. The loudest reactions are usually the extreme ones,
          the person who loved it enough to gush or the person annoyed enough to argue. The people in the middle, the
          ones who watched the whole thing and might come back tomorrow, leave nothing behind. Read only the notes you
          were handed and you drift toward whatever provokes the loud few, which is rarely the thing that held the quiet
          many.
        </p>
        <p>
          You can watch this happen in real time. A creator posts a spread of things, and the two that draw comments are
          the mildly controversial take and the clip where they slipped up on camera and people rushed to correct them.
          So the next month fills with hot takes and small staged mistakes, because those were the videos that talked
          back. The plain useful thing people saved without a word gets dropped for being boring, when boring only ever
          meant silent.
        </p>

        <h2>Read the quiet signals instead</h2>
        <p>
          The quiet people are not invisible to you. They are only invisible in the place you keep looking. The public
          numbers, likes and comments, are the noisy and unreliable ones. The private numbers say far more. Did people
          watch to the end. Did someone save it to find again later. Did someone send it to one friend in a message.
          Those are the actions the platforms themselves{" "}
          <a href="https://blog.hootsuite.com/tiktok-algorithm/" target="_blank" rel="noopener noreferrer">
            weight most heavily
          </a>
          , because a save or a send costs the viewer more than a tap and means more.
        </p>
        <p>
          A video with no comments and a stack of saves did not flop. It landed somewhere you could not hear it. So
          change the first thing you check. Not the like count, which mostly measures how many people were willing to
          perform a reaction in public. Look at the watch-through, the saves, the sends, the follow that shows up three
          videos later from someone who never said a word. That is your audience talking. It just talks in private.
        </p>

        <h2>You were not trying to be answered</h2>
        <p>
          The reason silence stings is that we all grew up talking to people who talk back. A conversation, a classroom,
          you say your piece and a face does something in return. Posting quietly broke that loop. You say the thing to a
          lens, and the response, if it comes at all, arrives as a number hours later with the person scrubbed out of it.
          So the natural read is that a small number means an empty room, when the room was full the entire time and
          simply watching the way people watch.
        </p>
        <p>
          The audience you are actually building will almost never tell you it is there. It will not comment. It will
          watch you for a month before it follows, and then follow without a word. Wait to feel the room before you
          believe it is full and you will walk away in front of a crowd. You were never really trying to make people
          react. You were trying to be worth watching, and most of that happens somewhere you will never hear.
        </p>
      </Article>
    </>
  );
}
