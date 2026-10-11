import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-told-them-it-was-bad")!;

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
          The first thing on the video is an apology. Sorry, the lighting is bad, and I&apos;m still figuring out this
          whole camera thing. This is probably dumb, but here goes. You have seen a hundred videos open this way, and if
          you have ever posted one, you have probably done it yourself.
        </p>
        <p>
          Those are the most valuable seconds you own. It is the moment a stranger decides whether to stay, and you spent
          it coaching them to expect less. Before your idea got a single word in, you talked them down from it.
        </p>

        <h2>People take the read you give them</h2>
        <p>
          A stranger meets you with nothing to go on. They do not know yet whether you are worth their time, so they take
          the cue from whatever you put in front of them first, and the first thing you put there was a warning that this
          might not be good. That warning sticks harder than you would guess. Researchers who study snap judgments found
          that people form an impression of a stranger&apos;s face in about{" "}
          <a
            href="https://www.bps.org.uk/research-digest/your-trustworthiness-judged-tenth-second-or-less"
            target="_blank"
            rel="noopener noreferrer"
          >
            a tenth of a second
          </a>
          , and giving them longer to look barely moves it, it mostly just makes them more sure of the read they already
          had. The line you open with works the same way. It sets a frame, and the rest of the video has to climb out of
          it.
        </p>
        <p>
          There is a name for the way that opening sounds. Linguists call it powerless speech, the hedging and the{" "}
          <a
            href="https://www.academia.edu/47908636/The_Evaluative_Consequences_of_Hedges_Hesitations_and_Intensifiers_Powerful_and_Powerless_Speech_Styles"
            target="_blank"
            rel="noopener noreferrer"
          >
            &quot;I&apos;m no expert but&quot;
          </a>{" "}
          that people reach for when they are unsure of themselves. The research on it is consistent and a little brutal.
          Say something in that register and you are judged as less credible and less competent than a person who says the
          exact same words plainly. The viewer is not weighing your idea yet. They are weighing how much you seem to
          believe it, and your apology answered that for them before they thought to ask.
        </p>

        <h2>The apology is not for them</h2>
        <p>
          Here is the part worth slowing down on. The disclaimer is not really aimed at the person watching. It is aimed
          at you. Psychologists call the move{" "}
          <a
            href="https://www.sciencedirect.com/topics/psychology/self-handicapping"
            target="_blank"
            rel="noopener noreferrer"
          >
            self-handicapping
          </a>
          , where you build an excuse in advance so that a bad result cannot mean the thing you are afraid it means. Tell
          everyone the video is rough and you are new and the light was bad, and a flop becomes a fact about the lighting,
          not about you. If it somehow does well, even better, you get to feel like you pulled it off with the odds
          against you. Your ego walks away clean either way.
        </p>
        <p>
          That is why the apology feels so good to add. It looks like humility from the outside and works like insurance
          from the inside. It is the small thing you do so that posting costs you a little less, and it quietly keeps
          everything you make small, because you never once let a video stand out there at full value where a real verdict
          could reach it. You are hedging the bet before you have placed it.
        </p>

        <h2>Being real is not the same as apologizing</h2>
        <p>
          The pushback is obvious. Is this not just being human. Do people not follow you for exactly that, the realness,
          the honest I-am-figuring-this-out feeling a glossy account never has. They do, and it matters, and I am not
          telling you to fake a polish you do not have. But there is a line running through the middle of this, and the
          apology is on the wrong side of it.
        </p>
        <p>
          The kind of openness that pulls people in sounds like someone doing the thing and letting you see the seams.
          Here is my third try and here is what finally clicked. I believed this for years and it turned out to be wrong.
          That draws you closer, because a person is handing you something real while plainly standing behind it. The
          disclaimer does the reverse. It hands you nothing except a lower bar and a quiet suggestion to leave. One is a
          person being honest about the work. The other is a person backing away from it. From the other side of the
          screen those feel nothing alike, even though both get dressed up as honesty.
        </p>

        <h2>Take it out</h2>
        <p>
          The fix is so small that people refuse to believe it. You do not replace the apology with a confidence you have
          to fake. Loud, hollow certainty lands about as badly as the apology does, sometimes worse. You just remove the
          apology and say the thing at the value it already has.
        </p>
        <p>
          Take the sorry off the top. Drop the &quot;I&apos;m no expert but.&quot; Stop leaving in the nervous little
          laugh where you flinch right after your own point. Delete the caption that calls it a random thought or a bad
          quality clip. Say what you came to say, plainly, and let it be as good or as ordinary as it actually is. What
          surprises you the first time you do it is that nothing bad happens. Nobody calls you arrogant for skipping the
          apology. They never saw the flaw from the inside the way you did, and without the disclaimer sitting in front of
          it, your idea finally gets to be the first thing they meet.
        </p>
        <p>
          You were never really apologizing to them. You were apologizing to the part of yourself that did not want to
          find out how the video would do. Post the next one without it, and you finally get to.
        </p>
      </Article>
    </>
  );
}
