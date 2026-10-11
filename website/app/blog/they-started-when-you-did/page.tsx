import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("they-started-when-you-did")!;

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
          You open the app to post, and there they are again. The account that started the same month you did. Back then
          you were basically the same size, close enough to notice each other, close enough to trade a comment now and
          then. Now they have ten times your followers, and a video of theirs is sitting at the top of your feed doing a
          number you have never once touched.
        </p>
        <p>
          Something goes cold in you for a second. You were not even thinking about them, and now the post you were about
          to make feels a little smaller than it did a minute ago. That reaction is worth stopping on, because the person
          who started when you did is quietly one of the most dangerous accounts in your feed, and not for the reason it
          feels like.
        </p>

        <h2>The person like you is the one who stings</h2>
        <p>
          Every niche has a giant, someone with millions of followers who has been at this for years. You do not really
          compare yourself to them. They are a poster on the wall. You compare yourself to the people at your own level,
          which is what people have always done. We work out how we are doing by measuring against others close to us,
          not against the far-off stars. That is the old idea behind{" "}
          <a
            href="https://journals.sagepub.com/doi/10.1177/001872675400700202"
            target="_blank"
            rel="noopener noreferrer"
          >
            Festinger&apos;s social comparison theory
          </a>{" "}
          from 1954, and it has held up well since. The similar person is the ruler you actually use. The distant one is
          just scenery.
        </p>
        <p>
          That is exactly why the friend who came up with you does the most damage. When someone close to you does better
          than you at the thing you care about most, it hurts more than a stranger doing the same, and psychologists
          measured this a long time ago. Tesser and his colleagues called it{" "}
          <a href="https://pubmed.ncbi.nlm.nih.gov/3346807/" target="_blank" rel="noopener noreferrer">
            the pain and pleasure of being close
          </a>
          : the closer the person, the harder the hit to how you see yourself when they pull ahead in your own field.
          The giant is inspiring. The peer is a verdict. And the feed keeps that peer right in front of you, because you
          follow them, so the app that is supposed to show you your own audience mostly shows you the one person best
          positioned to make you feel behind. In one study of Facebook users, about{" "}
          <a href="https://aisel.aisnet.org/wi2013/92/" target="_blank" rel="noopener noreferrer">
            a third said they felt resentment after browsing
          </a>
          , and the main trigger was not arguing or posting, it was quietly watching other people&apos;s lives go well.
        </p>

        <h2>Their number is not a scoreboard you are both on</h2>
        <p>
          Here is what the cold feeling gets wrong. You are reading their result as a score in a race you are both
          running, where they are ahead and you are behind. But you were never in the same race, and there was never one
          clock.
        </p>
        <p>
          Their jump almost certainly came from something specific to them. A video that happened to catch. An idea only
          they had. Someone with reach who shared it on the right afternoon. In this game a single post can redraw a
          whole account in a week, which means the gap between you is usually not the steady result of them being a
          little better every day. It is more often one thing that went right for them and has not gone right for you
          yet. So their follower count is honest feedback about their year and their luck. It reports on them. It says
          almost nothing about where your own thing is heading.
        </p>

        <h2>Both of the things you do about it cost you</h2>
        <p>
          The comparison would be harmless if it just stung and passed. It does not. It leaks into what you make next, in
          two directions that both feel like being smart and are neither.
        </p>
        <p>
          The first is that you start drifting toward their kind of video. They got big doing the loud thing, or chasing
          a format you would never have picked, and bit by bit your stuff starts to look more like theirs. You tell
          yourself you are learning from what works. What you are really doing is trading the part that was only yours
          for a thinner copy of someone else, and an audience can feel that swap even when you cannot name it.
        </p>
        <p>
          The second is quieter and worse. You read their lead as proof that you do not have it, and you ease off. You
          post less, and you sit on the ideas you are unsure about, and you half decide this was probably never going to
          happen for you. That flinch tends to show up right when your own thing is closest to turning, because the
          stretch where you feel most behind is usually the one just before the numbers move. So the comparison talks a
          lot of people into quitting a few weeks early, and it feels like maturity the whole time it is doing it.
        </p>

        <h2>Change who you are standing next to</h2>
        <p>
          You cannot argue yourself out of the cold feeling. It is older than you are and it fires before you get a say.
          What you can change is who you keep in front of your face while you are still tender about your own numbers.
        </p>
        <p>
          If a peer&apos;s success genuinely knocks you sideways every time it turns up, mute them. Not out of spite, and
          not forever. You can be honestly glad for someone and still know that staring at their account first thing
          every morning is not helping you make anything. Cheer for them from a distance where you can still think
          straight. Then take the attention you were spending on their number and put it on the only comparison that
          tells you anything real: you, a few months ago. Are the videos sharper than they were. Did you still find one
          thing worth saying this week. That is a race with a single runner in it, and it is the only one whose result is
          any of your business.
        </p>
        <p>
          The friend who pulled ahead was never evidence about you. They were on their own clock the entire time. The one
          account whose climb can actually tell you where you are going is the one you have been too busy watching them to
          look at. Your own.
        </p>
      </Article>
    </>
  );
}
