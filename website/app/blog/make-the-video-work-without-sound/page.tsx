import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("make-the-video-work-without-sound")!;

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
          The phone is propped against a coffee mug at 7:18 a.m. The kettle is loud, the apartment is quiet, and your
          thumb is already on the volume button. A video starts with a person talking. No words on screen. No object in
          the frame that explains anything. You give it half a second, still silent, and flick it away.
        </p>
        <p>
          That is how a lot of good videos lose. They need the viewer to be in the right room, with the sound on, ready to
          listen before the point has arrived. The feed does not give you that room. It gives you a bus seat, a line at
          the pharmacy, a couch next to a sleeping partner, a desk where the phone is supposed to be face down. If the
          video only works with sound, it is asking for better conditions than most viewers have.
        </p>
        <p>The fix is not louder audio. The fix is making the point survive silence.</p>

        <h2>Sound is a bonus, not the front door</h2>
        <p>
          Creators still plan too many videos as if the first viewer is sitting alone with earbuds in. Real viewing is
          messier. In a Verizon Media and Publicis Media survey of 5,616 US adults, {" "}
          <a href="https://www.streamingmedia.com/Articles/ReadArticle.aspx?ArticleID=131860" target="_blank" rel="noopener noreferrer">
            69 percent said they watched video with the sound off in public places
          </a>
          , and 25 percent said they watched without sound even in private. That is not a small edge case. That is the
          normal path into a video.
        </p>
        <p>
          This changes what the first second has to do. The opening image and the first line of text have to make the
          viewer understand what they are being offered before the voice helps. If the video opens on a face talking and
          the meaning lives only in the audio, the silent viewer has to trust you blind. Most will not. They do not hate
          the idea. They never got it.
        </p>
        <p>
          Think about how harsh that is. You can have a sharp sentence, a useful explanation, and a clean payoff, and the
          viewer can still leave because the first frame gave them nothing to read, notice, or understand. The failure
          happened before the argument began.
        </p>

        <h2>Captions are not decoration</h2>
        <p>
          Captions get treated like cleanup. Add them after the edit. Make them look nice. Keep them out of the way. That
          is backwards. For a silent viewer, the caption is the video until the sound comes on. It carries the first
          promise, the problem, the turn, and sometimes the whole reason to stay.
        </p>
        <p>
          The evidence is blunt. Facebook found that when feed based mobile video ads played loudly when people did not
          expect it, {" "}
          <a href="https://www.firstpost.com/tech/news-analysis/automatically-captioning-video-ads-can-increase-video-view-time-by-12-facebook-3677041.html" target="_blank" rel="noopener noreferrer">
            80 percent reacted negatively toward the platform and the advertiser
          </a>
          . The same report said adding captions increased video view time by an average of 12 percent. The lesson for a
          creator is plain enough: forcing sound creates friction, while readable context buys time.
        </p>
        <p>
          Captions also help people who can hear perfectly well. A review in Policy Insights from the Behavioral and Brain
          Sciences found that {" "}
          <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5214590/" target="_blank" rel="noopener noreferrer">
            more than 100 empirical studies link captions with better comprehension, attention, and memory
          </a>{" "}
          for video. That matters because short video is not only fighting silence. It is fighting a viewer who is holding
          a bag, checking a train stop, half listening to another room, or deciding whether this clip deserves the next
          ten seconds. Text gives the point another handle.
        </p>
        <p>
          The mistake is making captions behave like a transcript. A transcript records what was said. A good caption in a
          short video helps the viewer keep up with what matters. It can be simple. Name the problem. Label the turn. Put
          the sentence the video depends on where the eye can catch it. The viewer should not have to hunt for the point
          while the video keeps moving without them.
        </p>

        <h2>The silent version exposes the weak part</h2>
        <p>
          Watching your own video muted is uncomfortable because it removes the charm of your voice. Suddenly the gaps
          show. The opening shot sits there doing nothing. The first caption says a vague warmup sentence. The cutaway
          looks pretty but does not explain the point. The video may still sound fine, but silent it has no spine.
        </p>
        <p>
          That is useful. Silence is a test. If the muted version makes no sense, the viewer is carrying too much of the
          burden. They have to turn the sound on, infer the topic, wait for the point, and decide to care, all before they
          know what they are staying for. A strong short video lowers that burden. The first frame tells them where they
          are. The text tells them why it matters. The voice adds personality and detail after the video has already made
          itself legible.
        </p>
        <p>
          This is why subtitles have become normal far beyond accessibility. Stagetext reported that {" "}
          <a href="https://www.stagetext.org/news/yougov-survey-supports-stagetexts-findings/" target="_blank" rel="noopener noreferrer">
            80 percent of 18 to 24 year olds in its 2021 survey used subtitles some or all of the time
          </a>{" "}
          when watching TV on any device. The BBC covered the same research and noted that {" "}
          <a href="https://www.bbc.co.uk/news/entertainment-arts-59259964" target="_blank" rel="noopener noreferrer">
            four out of five viewers aged 18 to 25 used subtitles all or part of the time
          </a>
          . Younger viewers are not treating text as a crutch. They are treating it as part of watching.
        </p>

        <h2>Make the first watch possible anywhere</h2>
        <p>
          The practical standard is simple. Before you post, play the video with the sound off and ask whether a stranger
          could name the promise in two seconds. If they could not, the open is not ready. Add the words that make the
          situation clear. Change the first frame so something visible is already happening. Move the useful sentence up.
          Cut the throat clear that only works because your voice makes it feel friendly.
        </p>
        <p>
          This does not mean every video has to be covered in giant text. The goal is not clutter. It is access to the
          point. Sometimes one plain line is enough. Sometimes the object in the frame does the work. Sometimes the best
          caption is the sentence the viewer already has in their head. What matters is that the video does not collapse
          when the sound is gone.
        </p>
        <p>
          Sound still matters. Voice carries taste, pace, humor, warmth. Music can change the feel of a cut. But sound is
          what deepens the watch after the video earns it. It should not be the only doorway in.
        </p>
        <p>
          The viewer is not failing your video by watching it on mute. They are showing you the real room your video has
          to enter. Make it work there first, on the counter, in the line, on the train, beside the sleeping person. If the
          point survives silence, sound can make it better. If it does not, most people will be gone before they ever hear
          what you had to say.
        </p>
      </Article>
    </>
  );
}
