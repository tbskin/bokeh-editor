import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-checked-if-it-was-taken")!;

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
          You have an idea you are a little bit excited about. Not a huge one, but yours, the kind you actually want to
          make. And before you make it you do the reasonable thing. You open the app to check whether anyone has already
          done it. They have. Someone with more followers than you, and they did it well, and you close the app and you
          do not make yours.
        </p>
        <p>
          You told yourself that was research. What you were really doing was looking for a way to be let off the hook,
          and the app was happy to hand you one. It has already been done is the most respectable way there is to quit an
          idea, because it sounds like a judgment instead of a flinch. But it is almost never a real reason, and the
          checking that produces it is the exact thing that kills the idea.
        </p>

        <h2>The check is rigged</h2>
        <p>
          Here is what actually happens when you search to see if your idea exists. Search does not hand you a random
          version of it. It hands you the one that already won, the most viewed and most polished execution of the thing,
          because surfacing the winner is the whole job of search. So you take your idea, which is unmade and still only a
          thought, and you set it next to a finished and proven one a stranger built. Of course it looks small. You would
          lose that comparison every single time, with any idea, including the ones that would have worked.
        </p>
        <p>
          It feels like diligence and it is really an audition, run with the deck stacked, that you hold for your own
          idea and then use to reject it. The worse part is what it trains. Do this enough and you start pre-rejecting,
          killing ideas in your head before you even open the app, because you already know the finished version of
          everything is out there waiting to make yours look late. The check stops being a step you take and turns into
          the reason you make less.
        </p>

        <h2>It has been done is not the question</h2>
        <p>
          Step back and the worry falls apart on volume alone. Everything has been done. YouTube by itself takes in more
          than{" "}
          <a
            href="https://socialrails.com/blog/how-many-videos-uploaded-daily-statistics"
            target="_blank"
            rel="noopener noreferrer"
          >
            500 hours of video every minute
          </a>
          , and that is one platform, every day, without stopping. Whatever your idea is, a version of it exists, and so
          does a version of almost every true sentence you could say into a camera. If the bar for posting were real
          novelty, nobody would clear it, and the people you admire would have gone quiet years ago. They did not. They
          just stopped checking.
        </p>
        <p>
          The question was never whether the thing exists somewhere. It is whether the person about to watch you has seen
          it, and they mostly have not, because reach is far more broken up than it looks from the inside. Even your own
          followers miss most of what you make. A Reel reaches about{" "}
          <a
            href="https://www.socialinsider.io/social-media-benchmarks/instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            9 percent of the followers a creator already has
          </a>
          , and those are the people who chose you. So the crowd that saw the other person&apos;s video and the crowd
          that will see yours barely overlap. You are not stepping on that video. You are talking to a different room,
          one that will never scroll past the other version, and in that room yours is the first time anyone has said
          this out loud.
        </p>

        <h2>Audiences do not want new anyway</h2>
        <p>
          There is a deeper mistake folded into the fear, the belief that people are out there wanting something they
          have never seen. They are not, or not the way you imagine. Raymond Loewy, the designer behind a lot of the last
          century&apos;s familiar shapes, spent his career on this and gave it a name, MAYA, most advanced yet
          acceptable. His read was that people are pulled two ways at once, curious about the new and quietly wary of it,
          so the things that actually land sit at the{" "}
          <a href="https://ixdf.org/literature/topics/maya-principle" target="_blank" rel="noopener noreferrer">
            meeting point of novelty and familiarity
          </a>
          . Too strange and people bounce off. Too familiar and they do not notice it is there. What wins is the
          recognizable thing carrying one real twist.
        </p>
        <p>
          Read that back with your idea in mind and the twist is you. The concept can be borrowed and the format can be
          old, and the part that makes it worth the watch is that it is coming from you, with your reasons and your own
          example and the way you happen to land the point. That is not a watered-down kind of original. It is the exact
          mix audiences reward, and the thing you were worried was too similar was sitting right on the sweet spot the
          whole time.
        </p>

        <h2>This is not a license to copy</h2>
        <p>
          The honest objection is that this sounds like permission to copy, and it is not. There is a real difference
          between taking someone&apos;s idea and taking their execution. Lifting the actual video, the same script and
          the same shots, is both obvious and pointless, because that version already exists and yours would be the worse
          copy of it. That was never what you were afraid of doing anyway. You were afraid of making your own honest take
          on a subject someone else has also touched, which is not copying. It is just what making things has always
          been. Every cook works from a dish that existed before them.
        </p>
        <p>
          And the reassuring part is that you could not copy the real thing even if you set out to. You cannot borrow
          someone&apos;s reasons for believing what they believe, or the exact story you carry that they do not, or how
          you sound when you stop performing. That is the part people come back for, and it is the one part that was never
          available to take.
        </p>

        <h2>Stop holding the audition</h2>
        <p>
          Go back to the moment you found it already made and notice how it felt. It felt like relief. That is the tell,
          because relief is not what you feel when you miss out on something, it is what you feel when you are let off it,
          and finding your idea in someone else&apos;s feed lets you set it down without ever admitting you were nervous
          to pick it up. The search was not looking for information. It was looking for permission to stop, and it found
          some.
        </p>
        <p>
          So the fix is not a more original idea. There is no idea original enough to survive the rigged audition, and
          hunting for one is the same flinch in a smarter disguise. The fix is to quit checking whether you are allowed.
          Make the version only you can make, and make it because it is yours and because the people who need to hear it
          have not heard it from anyone they trust yet. Someone already made your video. Nobody has made the one where you
          are the person saying it, and that was always the only one you could make.
        </p>
      </Article>
    </>
  );
}
