import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-are-waiting-to-be-qualified")!;

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
          You figured something out recently. Some knot that had you stuck for weeks, and then one afternoon it came
          loose and you finally understood it. For a second you thought about making a video about it, explaining the
          thing to whoever is stuck where you were last month.
        </p>
        <p>
          Then you thought, who am I to explain this. People have been doing this for ten years. They know things I have
          not even run into yet. So you did not make it, and the idea went where all your best ones go, which is nowhere.
          The feeling underneath that is that you are not qualified yet. It is worth looking at, because it is almost
          exactly backwards.
        </p>

        <h2>The people who know the most are the worst at explaining it</h2>
        <p>
          The reason you assume the expert should make this video is that they know more, and more knowledge sounds like
          a better teacher. It is often the opposite. There is a well studied reason the person who knows a subject cold
          is frequently the worst one to explain it to someone who does not.
        </p>
        <p>
          In 1990 a Stanford researcher named Elizabeth Newton ran a simple game. One person tapped the rhythm of a
          famous song on a table, Happy Birthday or the national anthem, and another person tried to name it. The tappers
          guessed their listeners would get it about half the time. The listeners actually got it{" "}
          <a
            href="https://law.temple.edu/aer/2021/03/02/brain-lessons-tappers-and-the-curse-of-knowledge/"
            target="_blank"
            rel="noopener noreferrer"
          >
            about 2.5 percent of the time
          </a>
          . Inside the tapper&apos;s head the whole song was playing. All the listener heard was knocking. Once you know
          the tune you cannot un-hear it, and you badly overestimate how obvious your taps are.
        </p>
        <p>
          That gap has a name, the curse of knowledge, and it is heaviest in the people who know the most. Teachers call
          the classroom version the{" "}
          <a
            href="https://pressbooks.pub/etsu/chapter/instructor-prior-knowledge-expert-blindspot/"
            target="_blank"
            rel="noopener noreferrer"
          >
            expert blind spot
          </a>
          : once something is automatic for you, you lose access to what it was like when it was not, so you skip the
          exact step the beginner needed, make a leap they cannot follow, and take for granted a piece of background they
          do not have. The expert is not being lazy. They genuinely cannot see the thing you are stuck on, because they
          stopped being able to see it years ago. So wait until you are an expert is advice to wait until you are worse
          at this particular job.
        </p>

        <h2>What you know right now has a shelf life</h2>
        <p>
          Here is the part that should change your mind about posting today. The thing that makes you good at explaining
          this is not how much you know. It is that you still remember not knowing it. And that memory is the most
          perishable thing you own.
        </p>
        <p>
          Right now you still have the wrong turn you took. The thing you assumed that turned out to be false. The line
          in the tutorial everyone else seemed to get that made no sense to you. The stupid small detail that was
          secretly the whole blocker. You remember all of it because it happened to you a month ago and it was
          annoying.
        </p>
        <p>
          In a year it will be gone. Not the skill, the skill stays. What goes is the confusion. It fades the moment the
          thing becomes easy, and it does not come back. So the clearest, most useful video you will ever be able to make
          about this subject is the one you can make right now, while the struggle is still fresh, and it gets a little
          worse every week you wait, because every week you forget a bit more of what it was like to be the person you
          are trying to help.
        </p>
        <p>
          The expert cannot make this video. Not because they are not smart enough, but because they cannot remember the
          problem. You can, for a little while longer.
        </p>

        <h2>Qualified was never the question</h2>
        <p>
          Notice that you are not actually waiting to get better at the thing. You already did the thing. That is why you
          have something to say. You are waiting for a feeling, the feeling of being allowed, and it helps to know that
          the feeling never arrives, because there is no line you cross where someone hands you permission to talk.
          People far ahead of you still feel like frauds most days. The credential you are holding out for does not
          exist.
        </p>
        <p>
          And the person watching is not checking for it anyway. They do not open your video and audit your years of
          experience. They came in with a problem, and they are asking one thing, did this help me. A person one step
          ahead of them, who remembers the problem and can say it plainly, tends to help more than a distant authority
          explaining it from the top of the mountain. The near voice sounds like someone who was standing where they are
          standing about a month ago, because you were.
        </p>
        <p>
          There is a floor, and it matters. Do not teach what you do not understand. Do not put on an authority you have
          not earned. But that is not what is stopping you. What is stopping you is the opposite, and the honest version
          of it is also the stronger one. You are not claiming to be the expert. You are saying, here is the thing that
          finally made this click for me, in case you are stuck where I was. To the person you are talking to, that is
          not the smaller video. It is usually the better one.
        </p>

        <p>
          So make the one you think you are not qualified for. Not someday, once you have put in the years and forgotten
          why any of it was ever hard. Now, while you still remember. The video only you can make is the one about the
          thing you just barely learned, and you are the only person who will ever be this close to not knowing it.
        </p>
      </Article>
    </>
  );
}
