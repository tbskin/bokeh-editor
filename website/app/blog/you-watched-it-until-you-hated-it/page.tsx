import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-watched-it-until-you-hated-it")!;

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
          You cut the clip together, watch it back, and it lands. You watch it again to check the edit. Again to fix the
          caption timing. Again because the third cut feels a beat late. Somewhere around the tenth pass the thing goes
          dead in your hands. The line that made you laugh when you filmed it now sounds flat and obvious, the pacing
          drags, the whole idea seems thinner than it did an hour ago. So you either scrap it, or you start hacking,
          adding cuts and zooms to force some life back into a video that felt fine before you wore it out.
        </p>
        <p>
          Here is the part worth knowing before you delete anything. That sinking feeling almost never showed up on the
          first watch. It arrived after the tenth. And a feeling that only appears after the tenth watch is telling you
          about the watching, not about the video.
        </p>

        <h2>A word said too many times stops meaning anything</h2>
        <p>
          Say the word spoon out loud thirty times. Around the twentieth it stops being a word and turns into a noise
          your mouth is making. Psychologists have a name for this,{" "}
          <a href="https://en.wikipedia.org/wiki/Semantic_satiation" target="_blank" rel="noopener noreferrer">
            semantic satiation
          </a>
          , first pinned down by Leon Jakobovits James in a 1962 thesis at McGill. Repeat anything enough and the brain
          cells that carry its meaning tire out and go quiet, so the meaning drains away even though nothing about the
          word changed.
        </p>
        <p>
          The same thing happens to a video, and making it yourself does not protect you. Professional film editors, the
          people who do this for a living, will screen a single cut{" "}
          <a href="https://www.premiumbeat.com/blog/sharpen-film-video-editing-perspective/" target="_blank" rel="noopener noreferrer">
            up to hundreds of times over a project
          </a>
          , and the honest ones say the same thing about it. The Oscar-winning editor William Goldenberg puts it plainly,
          that watching footage over and over makes you start to lose your objectivity. Your sense that the video is
          boring is real. It is just a fact about your twentieth viewing, not a fact about the video.
        </p>

        <h2>The viewer meets it once</h2>
        <p>
          This matters because of a gap you never feel from the inside. You have seen this clip forty times. The person
          scrolling past will see it once, cold, with none of the wear you put on it. The joke you are sick of is brand
          new to them. The pace that drags for you moves fine for someone who has not memorized what comes next. You and
          the viewer are watching two different videos that happen to share the same pixels, and you are grading yours on
          a screening the audience will never attend.
        </p>
        <p>
          So when the tiredness starts making your edit decisions, it is quietly optimizing for a viewer who does not
          exist, someone who has already seen the thing ten times and needs it faster and busier to stay awake. Nobody in
          your audience is that person. You are the only one who got bored, and you got bored on purpose, by watching.
        </p>

        <h2>Which way the mistake runs</h2>
        <p>
          The dangerous thing is that satiation does not push you in a random direction. It pushes you two specific ways,
          and both make the video worse.
        </p>
        <p>
          First, it makes you kill good work. The plain, clear version that would have landed fine starts to feel too
          plain to post, so it dies in your drafts and you never find out it was fine. Second, when you do post, it makes
          you over-cut. You add a jump cut where none was needed, speed up a line that was landing fine, all to put back
          an energy the video never lost, because the flatness you are fighting is only in your head. A clip that was clean and calm gets
          chopped into something restless, and restless reads to a first-time viewer as a video that does not trust its
          own idea.
        </p>
        <p>Both moves come from the same place. You mistook your own fatigue for feedback.</p>

        <h2>Decide early, then stop looking</h2>
        <p>
          The fix is almost embarrassingly simple, and it is mostly about when you decide, not how hard you look.
        </p>
        <p>
          Make your real judgment early, on the first watch or the second, while your eyes are still fresh, and write it
          down. The hook works, the point lands, keep it. That verdict, taken cold, is worth more than any opinion you
          form on pass number fifteen. After that you have spent your fresh eyes, so stop asking the video whether it is
          good and only make changes you can defend on their face. The caption is mistimed. This take has a stumble. That
          is real work. The thought that it all feels kind of boring now is not information anymore, it is just
          tiredness.
        </p>
        <p>
          When you can, buy back a fresh pass with time. Editors say putting a cut away for a day resets your eyes so
          completely that{" "}
          <a href="https://www.filmeditingpro.com/how-to-stay-objective-when-watching-your-own-cuts/" target="_blank" rel="noopener noreferrer">
            skipping a day feels like skipping a week
          </a>
          . You will not have a full day for every post, but you have twenty minutes. Walk away, make coffee, come back,
          and watch it one time as if it just showed up in your own feed. That single cold viewing tells you more than
          the hour of staring that wore you down.
        </p>
        <p>
          The fastest reset of all is another person. Show it to someone once. They do not have to say a word. Watching
          it sit next to someone who has never seen it snaps you back into how it actually plays, and the flaws that are
          real jump out while the ones you invented quietly disappear.
        </p>
        <p>
          The video you are sick of is usually not the video anyone else will see. Somewhere back on the first or second
          watch there was a version you were happy with, before you rubbed the meaning off it. Most of the time,
          finishing is not about improving that version. It is about trusting the person who saw it fresh, and getting
          out before you talk yourself out of something that was already done.
        </p>
      </Article>
    </>
  );
}
