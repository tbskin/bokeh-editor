import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-are-the-worst-judge-of-your-own-videos")!;

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
          You have two videos ready to go. One you worked on for hours and you are proud of it. The other you almost
          deleted, because it felt thrown together and you are not sure it is any good. You post the one you are proud
          of. The other one sits in your drafts, and a week later you have forgotten it is there.
        </p>
        <p>
          Almost everyone does that, and it feels like good judgment. You made something better, so you sent the better
          one. The trouble is the word better. You believe you can tell which of your videos is good. You almost
          certainly cannot, and running your account as if you can is quietly throwing away your best work.
        </p>

        <h2>Quality only gets you so far, then it is closer to chance</h2>
        <p>
          There is a study people bring up whenever this comes up, and it earns the mention. In an experiment published
          in Science, researchers built a fake music site where more than fourteen thousand people listened to and
          downloaded songs by bands they had never heard of. Some visitors could see how many times each song had
          already been downloaded. Others saw nothing and judged on the music alone. Then they watched what won.
        </p>
        <p>
          The finding was that quality decided the edges and not much else. The very best songs{" "}
          <a href="https://www.science.org/doi/10.1126/science.1121066" target="_blank" rel="noopener noreferrer">
            rarely did badly, and the very worst rarely did well, but almost any result in between was possible
          </a>
          . A song that was genuinely good could land anywhere from a small hit to nearly ignored, depending on nothing
          more than who happened to like it first and what everyone after that saw them do. Once a song was better than
          terrible and worse than perfect, where it ended up was close to a coin flip.
        </p>
        <p>
          Your videos live in that same middle band. A few are so good they will do fine no matter what, and a few are
          so flat they will sink no matter what. The rest, which is most of them, sit in the wide zone where the outcome
          is decided by things you do not control. Who saw it first. What mood the feed was in that hour. Whether one
          person with reach shared it before anyone else did. The gap between your fourth best video and your best one is
          mostly noise, and from where you stand you cannot hear the difference.
        </p>

        <h2>You are grading the wrong thing</h2>
        <p>
          Here is the deeper reason you cannot call it. You do not grade a video on what a stranger will get from it. You
          grade it on how it felt to make and how much of yourself went in. The audience grades it on one question, did
          this land for me, and they arrive with none of your context.
        </p>
        <p>
          Think about what you are actually looking at when you rate your own clip. You have seen the raw footage twenty
          times. The bit that still makes you laugh is dead to you now, and the line you are sick of is the one they have
          never heard. You know exactly what you meant, so you cannot hear how it sounds to someone who does not. Being
          this close to the work is the specific thing that blinds you. The video you are proud of is often the one where
          you fell for the effort. The one you almost deleted is sometimes just the one that came out easily, and easy is
          not the same as bad.
        </p>
        <p>
          So the confidence you feel is real, it is just not about them. It is a report on your relationship with the
          footage. That is a fine thing to have and a terrible thing to make decisions with.
        </p>

        <h2>The drafts folder is where your evidence goes to die</h2>
        <p>
          Every video you kill before posting is a coin you decided not to flip. You will never see how it would have
          landed, which means the gut that told you to kill it never finds out whether it was right. It just keeps making
          the same call, uncorrected, forever. That is the real cost, and it is bigger than one lost video.
        </p>
        <p>
          Posting is not only how people find your work. It is the only test you have. A clip that never goes out teaches
          you nothing, because a reaction is data and so is a shrug, and a draft gives you neither. You are running a slow
          experiment on what your audience actually responds to, and you are throwing out half the results before you
          read them. Always the same half, the ones that did not match your taste going in. Over a month that is a leak.
          Over a year it is most of what you could have learned about your own audience, gone, filtered out by the person
          least able to judge.
        </p>

        <h2>Let the audience be the judge</h2>
        <p>
          None of this means post everything. Keep a floor. Do not put out something broken, or mean, or so dead that you
          already know the exact reason it is dead. Below that line, trust yourself completely. The change is only about
          what happens above it.
        </p>
        <p>
          Above the floor, the videos you are genuinely unsure about are the ones to post, and if anything they should go
          out first. Not because low effort is a virtue, but because your uncertainty is not information. It feels like
          information. It is just a measure of how near you are standing to the thing. The audience is the only judge
          whose vote counts here, and you cannot borrow their eyes by staring harder at your own screen. You have to
          actually let them look.
        </p>
        <p>
          The videos you are proudest of will keep flopping sometimes, and the throwaway will keep outrunning them, and
          it will keep feeling a little insulting. That is not a sign your taste is broken. It is a sign you were never
          the right person to ask. Post the one you almost deleted. Then watch what it does, because that is the only
          part of any of this you actually get to learn from.
        </p>
      </Article>
    </>
  );
}
