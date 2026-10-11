import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("your-face-was-never-the-point")!;

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
          You have an idea you want to make, and then you picture yourself on camera saying it, and the whole thing
          quietly dies. Not because the idea is weak. Because you do not want to be the person in the video. You do not
          want the people at work finding it, or your face looping on some stranger&apos;s phone, or the small private
          misery of watching yourself talk. So the idea stays in your head, where it is comfortable and where it does
          nothing.
        </p>
        <p>
          The usual advice here is to get over yourself and show your face. I think that skips what is actually going on.
          Your face was never the thing that was going to build you an audience, and pointing a camera at it was never
          going to rescue a video that had no person in it. You are worried about the wrong thing.
        </p>

        <h2>People do not follow faces</h2>
        <p>
          Think about the accounts you actually follow. You did not follow them the first time you saw a face. You
          followed them because after a few videos you had a feel for who they were, what they thought, how they saw the
          thing the two of you both care about. A face was usually part of that, but it was carrying something
          underneath. The thing you bonded with was a person, and a person is made of opinions and a way of talking, not
          a jawline.
        </p>
        <p>
          This is the boring machinery under the word audience. The one-sided bond you form with someone you follow but
          have never actually met, which researchers call parasocial, gets built the slow way, out of showing up again
          and again and letting a little of yourself through each time. It can get surprisingly strong. People report
          that their favorite creators meet their emotional needs{" "}
          <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11002006/" target="_blank" rel="noopener noreferrer">
            better than the acquaintances they actually know in real life
          </a>
          , if not quite as well as close friends and family. You do not build that with a camera aimed at your face. You
          build it by making it obvious that somebody specific is there.
        </p>
        <p>
          You can watch this happen in real time. Two accounts post about the same narrow thing, coffee, or budgeting, or
          fixing up old cars. One shows a face and one never does. Six weeks later you have a clear sense of the faceless
          one, the things they refuse to do, the opinion they keep circling back to, the way they open a video, and you
          would know them anywhere. The one with the face you have already lost, because there was a face and nothing
          behind it. The camera was the only thing they brought.
        </p>

        <h2>You can be on screen and still be nobody</h2>
        <p>
          Here is the part that should make the face matter less to you, not more. Plenty of people do show their face
          and still build nothing, because being visible is not the same as being present. You have scrolled past a
          hundred of them today. Someone on camera reading tips you could get anywhere, in a voice with no opinion in it,
          always saying the agreeable thing, giving you no sign that a particular human made this instead of a content
          calendar. Their face is right there and you forget them before the next video loads.
        </p>
        <p>
          So the face is not the switch. It can be on while the person is missing, and it can be off while the person is
          completely there. An account that never shows anyone can still have a clear point of view and a narrator who
          obviously has taste and is not hiding it. What no video survives is the version where nobody is home. The most
          absent content there is, a flat voice reading over stock clips, is exactly what people have started to distrust
          the second they smell it. Among the people who watched a video they figured a machine had made,{" "}
          <a
            href="https://www.businesswire.com/news/home/20260121875037/en/83-of-Consumers-Can-Spot-AI-Videos-36-Say-It-Lowers-Brand-Trust-According-to-Animotos-New-Report"
            target="_blank"
            rel="noopener noreferrer"
          >
            more than a third said it lowered their trust
          </a>
          . They were not reacting to a missing face. They were reacting to a missing person.
        </p>

        <h2>Put a person in it, then worry about the camera</h2>
        <p>
          If presence is what actually matters, then the work is not learning to love your face. It is deciding to have a
          point of view and let it show. Say the thing you believe instead of the safe blend of what everyone says. Pick
          what goes in the video like someone with taste, not like someone filling a slot. Have reactions and let them
          land. Let a viewer feel that one specific person, with specific opinions, chose to make this.
        </p>
        <p>
          Once you are doing that, the camera turns into a much smaller question, a matter of format and comfort. It can
          be your hands on a table. It can be your voice over footage you shot. It can be your face, when you want it,
          because that really is the quickest way to let people feel you are there. Nearly eight in ten people say they
          trust a video more{" "}
          <a href="https://studyfinds.org/why-consumers-trust-videos-people-more-than-ai/" target="_blank" rel="noopener noreferrer">
            when there is a real person in it
          </a>
          . But that is a shortcut to presence, not a replacement for it. Take the shortcut if you are comfortable. If
          you are not, you are not stuck. Presence has more than one form.
        </p>

        <h2>The scarier thing</h2>
        <p>
          This is why hiding your face feels like such a relief and still does not fix anything. You think the fear is
          the camera. It is not. The camera is the cheap version of the fear, the one you can point at and argue about.
          The real one is sitting underneath it. It is having a clear opinion with your name on it, in a place where
          someone could disagree with the actual you and not just with how you look on video.
        </p>
        <p>
          You can avoid the camera for as long as you like. There are people building real audiences who have never shown
          their face and never plan to. The thing none of them got to skip is the other one, being a specific person out
          loud, on purpose, where it can be judged. That was the part you were actually avoiding. It was also always
          going to be the part that built the thing you said you wanted. The face was just the decoy you let yourself
          argue about instead.
        </p>
      </Article>
    </>
  );
}
