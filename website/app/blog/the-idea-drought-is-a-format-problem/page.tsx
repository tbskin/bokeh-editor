import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("the-idea-drought-is-a-format-problem")!;

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
          You sit down to post and there is nothing there. You open the app, scroll your own camera roll, close it, tell
          yourself something will come to you tomorrow. By Friday the honest sentence in your head is some version of the
          one everybody reaches for. I have run out of things to say.
        </p>
        <p>
          You almost certainly have not. What runs out is not ideas. It is the patience to invent a whole video from
          nothing, again, on a Tuesday, staring at a blank screen with no shape to pour anything into. That is a
          different problem than being out of things to say, and it has a different fix.
        </p>

        <h2>What a blank post is really asking</h2>
        <p>
          Look at what a blank post demands from you. Not one decision. All of them at once. What is this even about. How
          does it start. How long does it run. What is the point, and is the point a laugh or a lesson. Where does it
          land. Every time, from zero, three or four times a week. Of course you freeze. You are not short on things to
          say. You are being asked to design a new thing end to end, on a schedule, and nobody can keep that up for long.
        </p>
        <p>
          Now watch someone who never seems to dry up. It is easy to assume they are simply more creative than you, that
          ideas fall on them while you sit there empty. Look closer and it is nearly the opposite. They are not inventing
          much at all. They found a shape that works and they run it over and over, changing only what goes inside.
        </p>

        <h2>A format is the part you decide once</h2>
        <p>
          Call that shape a format. Not the topic, not the niche, the container. A cook who posts &quot;here is what I
          make from one random ingredient a viewer picks&quot; has a format. So does the person who reviews one small
          spot in their neighborhood every week, or answers one question from their comments, or shows the same
          before-and-after on a different room each time. The idea changes every post. The frame does not.
        </p>
        <p>
          The frame is the set of decisions you make one time and then stop making. How it opens, how long it goes, the
          rhythm, the kind of payoff at the end. Settle those once and they are settled. What is left each week is small.
          What goes in the slot this time. You are no longer designing a video from scratch. You are filling one in.
        </p>
        <p>
          That is the whole trick, and it is why the scary question quietly goes away. It stops being &quot;what should I
          make,&quot; which is infinite and has no floor, and becomes &quot;what goes in the format this week,&quot;
          which is small enough to answer over coffee. Same person, same imagination, completely different weight on your
          shoulders.
        </p>

        <h2>Almost everyone dries up at the same spot</h2>
        <p>
          Here is the part that should make you feel less alone and a little more suspicious. If the idea drought were
          really about your particular creativity, it would hit some people and spare others. It does not. It is close to
          universal. In Adobe&apos;s 2025 survey of more than sixteen thousand creators, half of them named{" "}
          <a href="https://news.adobe.com/news/2025/10/adobe-max-2025-creators-survey" target="_blank" rel="noopener noreferrer">
            brainstorming content ideas
          </a>{" "}
          as one of the top things they wish they could hand off to software. Half. That is not a room full of people who
          lack imagination. That is a room full of people hitting the same wall in the same place.
        </p>
        <p>
          When almost everyone gets stuck at one step, the step is the problem, not the people. Starting from nothing is
          the hard part. Not your ideas, not your taste, not whether you are an interesting person. The drought is the
          price of building each post from a blank page, and a format is just refusing to start from a blank page.
        </p>

        <h2>The fear that it turns you into a formula</h2>
        <p>
          The obvious worry is that a format flattens you. Same thing every week until people stop caring. It can, if you
          let the container do all the work and stop paying attention to what goes in it. But that is the rare case, not
          the common one. The common thing is the reverse. The frame frees up the part of your brain you were burning on
          logistics, so more of you ends up in the actual idea.
        </p>
        <p>
          And people do not resent a familiar shape. They come back for it. Think of any series you keep up with. You
          know roughly what each episode will look like before it starts, and you watch anyway, because the shape is the
          promise and the surprise lives inside it. The trick is to change enough within the frame that this week earns
          its own watch. Keep the container. Do not phone in the filling.
        </p>

        <h2>Reach for the container, not another idea</h2>
        <p>
          So the next time the drought hits, notice what you actually reach for. Most people reach for a new idea, a
          better one, the clever thing that will finally break the dry spell. That is reaching for more of the exact
          thing that is hard. Reach for the container instead. Look back through your own posts, find the one that was
          easy to make and did not embarrass you, and work out what its shape was. Then run that shape again, and again,
          until it stops working.
        </p>
        <p>
          It will stop eventually. They all wear out. But when it does, you will not be out of ideas. You will be out of
          a format, and by then you will know the difference, which is the whole thing you were missing on the nights the
          screen stayed blank.
        </p>
      </Article>
    </>
  );
}
