import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-taught-them-something")!;

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
          You spend a whole day on a real explainer. You get the facts right, you cut it clean, you are proud of it. It
          goes out and does almost nothing. Then, half asleep, you post a throwaway line you filmed between two other
          things, something like a two minute video should not eat a whole evening to edit, and the comments fill up with
          people saying &quot;this is so me&quot; and &quot;finally someone said it.&quot; Same account, same face.
          Completely different day.
        </p>
        <p>
          The easy read is that the short one got lucky, or the algorithm was in a good mood. Look closer and it was
          neither. One video told people something they did not know. The other told them something they already felt and
          had never heard said out loud. Those are two different jobs, and only one of them builds an audience.
        </p>

        <h2>Useful gets used up</h2>
        <p>
          The advice everyone repeats is to be useful. Teach something. Answer the question people already have. And it
          works, up to a point. People watch, some save it, a few even thank you in the comments. But a fact is a
          transaction. The second someone has it, they are done with you. You do not need the person who taught you how
          to fix gray apartment footage once your footage stops looking gray. The value was real, and it walked off
          without you.
        </p>
        <p>
          That is why so many careful, genuinely helpful accounts stay small. Each video does its little job and leaves
          nothing behind, because what it delivered could have come from anyone with the same information. Being helpful
          feels like the safe, generous thing to do, and it is also the most replaceable thing you can be. There is
          always another account with the same tip and a slightly better hook.
        </p>

        <h2>What &quot;this is so me&quot; actually is</h2>
        <p>
          Recognition is a different thing from information. Information tells you something about the world. Recognition
          tells you something about yourself, usually a thing you already half knew but had never quite put into words.
          When someone watches and thinks that is exactly how I feel, you did not hand them a fact. You held up a mirror,
          and it landed because it was accurate.
        </p>
        <p>
          This is not a soft, feel-good point. There is a reason it sticks. People remember information far better when it
          is tied to themselves than when it is about anyone else, something memory researchers have measured since the
          1970s (the{" "}
          <a
            href="https://psychology.iresearchnet.com/social-psychology/self/self-reference-effect/"
            target="_blank"
            rel="noopener noreferrer"
          >
            self-reference effect
          </a>
          ). A tip about lighting gets filed under lighting, in a drawer you almost never open. A sentence that names your
          exact frustration gets filed under you, and that is the one drawer you are always rummaging through. So the
          video gets remembered as being about them, and the person who made it gets remembered right alongside it.
        </p>

        <h2>Why they send it</h2>
        <p>
          Recognition also travels, and for a reason that has nothing to do with how useful it is. People share things to
          say who they are. The New York Times ran a large study on why we pass content around and found that{" "}
          <a href="https://contently.com/2012/02/24/psychology-of-sharing/" target="_blank" rel="noopener noreferrer">
            68 percent share to give the people in their lives a better sense of who they are
          </a>
          . A &quot;this is so me&quot; video is a ready-made way to do exactly that. Sending it to a friend is a small
          statement: this is what I am like, and it said it better than I could.
        </p>
        <p>
          So the two kinds of video move through the world differently. A good tip gets saved, which is a private act,
          done for later, for you. A moment of recognition gets sent, which is a public act, and it is about the sender.
          One quietly fills a stranger&apos;s saved folder. The other puts your name in front of a new person, carried
          there by someone they already trust. That second thing is how audiences actually grow, and useful content
          rarely sets it off.
        </p>

        <h2>Say the quiet part, exactly</h2>
        <p>
          The move is not to teach less. It is to say the thing everyone in your corner already thinks and nobody posts,
          usually because it feels too obvious, or too small, or a little embarrassing to admit out loud. The complaint
          you would say to a friend but would not point a camera at. The thing you quietly assumed was just you.
        </p>
        <p>
          There is a trap on the way there, though. Trying to be relatable and being recognizable are not the same.
          Aiming at everyone with a flat, safe, Mondays-are-hard sort of line lands on nobody, because a feeling that
          fits everyone is too loose to feel like it belongs to anyone. Recognition comes from the specific version. Not
          I get stressed at work, but the way you reread a slightly cold message from your boss nine times looking for
          the hidden meaning. The more exact the situation, the more people feel caught, because the precision is the
          proof that you actually felt it too and did not just guess at what a person might feel.
        </p>
        <p>
          You already have a long list of these. It is the stuff you say when the camera is off, the private gripe, the
          opinion you hold back because it seems too petty to count as content. That is the raw material, and it was
          never too small. Small and exactly true was the whole point.
        </p>

        <h2>The stranger who remembers you</h2>
        <p>
          You do not have to give up the useful videos. Keep making them, they earn their watches. But if the only thing
          you ever do is tell people what they did not know, you will be a helpful stranger they forget the moment their
          problem is solved. The videos that make someone stay are the ones where they see themselves in it and realize
          you saw it first. Teach them something and they will thank you and keep scrolling. Tell them what they already
          felt, and they will want to know how you knew.
        </p>
      </Article>
    </>
  );
}
