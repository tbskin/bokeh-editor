import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-are-not-afraid-of-strangers")!;

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
          You film something and it is good. You watch it back once and it holds up. Then your thumb hovers over the post
          button and you set the phone down. Not because the video is bad. A face came into your head. Someone from your
          old job, or an ex, and you pictured that one person seeing it, and suddenly you did not want to.
        </p>
        <p>
          People will tell you the reason they never started is time, or not having ideas. Sometimes that is true. But
          sit with someone who has a folder of clips they never posted and it is usually neither. It is that the first
          people to see anything they make are the exact people they would least want watching them try.
        </p>

        <h2>The audience that stops you is small, and you already know it</h2>
        <p>
          You are not actually scared of strangers. A stranger who thinks your video is bad costs you nothing. You will
          never meet them, and by tomorrow they have scrolled past a hundred other things and forgotten yours. The fear
          is not pointed at them. It is pointed at maybe forty people. The ones with your number, the ones who knew you
          before this and will now watch you reach for something and form a private opinion they never say to your face.
        </p>
        <p>
          That is the group that makes the first post feel like standing up at a wedding to say something. Not the
          millions you picture later. The handful who already carry a version of you around in their heads and did not
          ask for a new one.
        </p>

        <h2>The fear is really about being caught trying</h2>
        <p>
          Notice the exact shape of it. It is not the fear that the video is bad. It is the fear that someone who knew
          the old you will watch you obviously care about something and think, who do they think they are. Trying is the
          exposed part. A lazy post protects you, because nobody can accuse you of wanting it. The moment you put up
          something you clearly worked on, in front of people who only ever saw you not bothering, you have told them you
          want to be more than the version they filed you under. That is the thing that feels dangerous, and a stranger
          has no way to touch it.
        </p>

        <h2>Your first crowd is the one crowd you did not pick</h2>
        <p>
          This is why the start feels so much worse than anything that comes after. A new account does not get handed
          strangers first. The app shows your video to the people already attached to you, your contacts and whatever
          followers you carried in from another life, none of whom are there for the thing you just made. Your opening
          crowd is the one crowd you would never have chosen.
        </p>
        <p>
          You can measure how big this problem is by how few people ever get past it. Most young people say they want
          this. In one survey,{" "}
          <a
            href="https://www.cnbc.com/2024/09/14/more-than-half-of-gen-z-want-to-be-influencers-but-its-constant.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            57 percent of Gen Z said they would be an influencer if they could
          </a>
          . Then look at who actually posts instead of watching, and the number falls off a cliff. The long-running rule
          of online communities, that about{" "}
          <a href="https://www.nngroup.com/articles/participation-inequality/" target="_blank" rel="noopener noreferrer">
            90 percent only read, 9 percent react, and 1 percent make the thing
          </a>
          , still roughly holds. The distance between wanting to and doing it is enormous, and it is mostly not about
          talent. It is the first handful of posts, when the only people watching are the ones whose opinion you can feel
          in your body.
        </p>

        <h2>It gets lighter as it gets bigger</h2>
        <p>
          Here is the part that runs against the feeling. The fear does not grow with your audience. It shrinks. A
          thousand strangers will weigh on you less than the first twelve views from people who know you. Opinions from
          people close to you land harder than opinions from people who are not, and that is the whole mechanism. So the
          most frightening moment is the smallest one, the very beginning, when your audience is made up entirely of
          people near enough to matter.
        </p>
        <p>
          Which means most people quit during the one stretch that was always going to feel bad, and they read that bad
          feeling as proof they are not built for this. They were just early. The discomfort was never a verdict on the
          work. It was a fact about who happened to be watching at the size you were.
        </p>

        <h2>The fix is not caring less</h2>
        <p>
          The usual advice is to stop caring what people think. That is not advice. It is asking an anxious person to
          become a calm one, and it has never worked on anybody. You are not going to shrug off the people who know you,
          so do not build your plan on it.
        </p>
        <p>
          A few things actually help. Make the video for one specific stranger who has the problem you are talking about,
          and keep them on the other end of it instead of your coworker. Let the known audience sort itself out, which
          happens faster than you expect, because some mute you and the rest quietly get used to it, and within a few
          weeks the people who found you on purpose outnumber the people who knew you first. You are also allowed to
          choose your crowd. Posting to close friends, or blocking the two faces you keep flinching at, is not hiding. It
          is refusing to let the app pick your opening night for you.
        </p>
        <p>
          One more, because people get it backwards. Do not test the video on the people you are afraid of. The instinct
          is to send the draft to a close friend and ask if it is cringe, which hands the veto to the exact warm audience
          that was distorting you in the first place. Their answer is shaped by knowing you, not by whether the video
          works for the stranger it was built for. Post it and read what the strangers do instead.
        </p>
        <p>
          None of this makes the first post comfortable. It will still feel like too much for something most people
          scroll past in a second. But the feeling is not rare and it is not really about you. It is the specific,
          temporary cost of being seen by people who knew you before, and it lifts, not because you get tougher, but
          because the audience keeps changing under you until the heavy opinions are outnumbered by weightless ones.
        </p>
        <p>
          The people you are scared of are not your audience. They are just standing closest to the door. Post through
          them.
        </p>
      </Article>
    </>
  );
}
