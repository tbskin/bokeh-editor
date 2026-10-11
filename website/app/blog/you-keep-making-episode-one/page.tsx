import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-keep-making-episode-one")!;

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
          You post a video, it does its numbers over a day or two, and then it is gone. The next one starts from nothing.
          You are not adding to anything you built yesterday. Every time you open the app to post, you are walking back
          into the same room and introducing yourself again, from scratch, as if the last one never happened.
        </p>
        <p>
          And someone can watch your whole video, like it, even think for a second that you are good at this, and still
          have no reason to see you again tomorrow. They enjoyed it the way you enjoy a song that comes on in the car. It
          was nice, it ended, and nothing pulled them back. Most creators treat that as just how it works. It is actually
          the thing quietly capping your growth.
        </p>

        <h2>The feed hands you a room of strangers every time</h2>
        <p>
          Almost everyone who sees your video has never seen you before. On YouTube Shorts, about{" "}
          <a href="https://www.zebracat.ai/post/youtube-shorts-statistics" target="_blank" rel="noopener noreferrer">
            74 percent of views come from people who do not follow the channel
          </a>
          , and the other feeds run on the same idea, pushing each post out to a crowd the algorithm picked rather than to
          the people who already know you. For reach, that is good news, and it is why a small account gets seen at all.
          But it has a cost nobody mentions. Every video you make is a cold open. It plays for a room of strangers who owe
          you nothing, and when it ends they drop back into the feed and you drop back to zero.
        </p>
        <p>
          The work you did to win those strangers does not carry over to the next video. You spent it, they scrolled on,
          and tomorrow you spend it again on a fresh set of strangers who also never heard of you. You can keep that up
          for a year and still feel like you are starting over every single week, because in a real way you are. Nothing
          is stacking. The videos are not talking to each other, and neither are the people who watched them.
        </p>

        <h2>A series gives someone a reason to come back</h2>
        <p>
          A one-off video can do exactly one thing. It can be good. A series can do a second thing that no single video
          can manage on its own. It can make a person want the next one.
        </p>
        <p>
          That want is a different kind of pull, and a stronger one. Getting familiar to someone is slow. It takes months
          of them bumping into you by accident until your face stops reading as new. Wanting the next part is immediate.
          You leave one thread open at the end of a video and a chunk of the people who watched carry it out of the app in
          their heads. We hang onto an unfinished thing more than a finished one, which is the whole reason a cliffhanger
          works,{" "}
          <a href="https://www.psychologytoday.com/us/basics/zeigarnik-effect" target="_blank" rel="noopener noreferrer">
            an effect first measured back in 1927
          </a>{" "}
          and used by every show that has ever cut to black in the middle of a scene. A finished video lets you go. An
          open one keeps a small hook in.
        </p>
        <p>
          Almost nobody pulls that lever. The instinct is to wrap every video up clean and hand the viewer something
          closed, with no reason to look for more, because there is no more coming. Every post is episode one of a show
          that never gets an episode two.
        </p>

        <h2>But making part two is a trap</h2>
        <p>
          So the obvious fix is to make part two, and the obvious fix falls apart, for a reason worth sitting with. Most
          of the people watching have never seen you. Open with a line like this is part two, and you have built
          something that only works for the small slice who caught part one, in a room mostly full of people who did not.
          To them it is a story that starts in the middle. They never saw the setup, so the payoff lands on nothing, and
          they leave. The video does worse than your usual, you decide series just do not work on this app, and you slink
          back to one-offs.
        </p>
        <p>
          That is why so many people tried this once and dropped it. Not because the instinct to serialize was wrong, but
          because they built a sequel, a thing that needs the viewer to have done their homework, and dropped it onto a
          feed that keeps handing the video to people who did not.
        </p>

        <h2>Make episodes, not sequels</h2>
        <p>
          Television worked this out a long time ago. A good episode of a show pulls off two jobs at the same time. A
          stranger can turn it on having missed everything before it and still get a whole, satisfying story that stands
          on its own. And the person who has been watching for weeks gets the next piece of the bigger thing, and a reason
          to show up again. It does not pick between the newcomer and the regular. It serves both of them in the same half
          hour.
        </p>
        <p>
          That is the shape to copy. Not part one and part two, where the second one is useless without the first.
          Episodes. Each video is complete on its own, so the stranger who lands on number nine gets a full thing and
          never feels like they walked in halfway. But there is a container around all of them that stays the same, a
          recurring segment, or a running project you keep pushing forward, so the person who has seen a few knows another
          one is coming and roughly what it will be. The newcomer gets a whole video. The regular gets the next
          installment. Neither one is asked to have watched anything first.
        </p>
        <p>
          You can hear the difference in how a thing is framed. Doing this every day until it works is a premise a
          stranger can join on day forty and get instantly. Building this in public, week by week, is a series. The
          cooking accounts that grow are not posting unrelated recipes into the void, they are running the same show with
          a new dish in it each time. The container is what turns a pile of separate clips into something a person
          can actually follow, instead of a stream of good moments they forget by dinner.
        </p>
        <p>
          A one-off asks you the same thing every time, forever. Will a stranger stop for this. It is a fair question and
          you never get past it, because the format will not let you. A series lets you finally ask a better one. Will
          they come back. You cannot ask that of a video that ends and points nowhere, because you built it to be the last
          thing they need from you.
        </p>
        <p>
          So stop making things that end. Make a thing that has a next one, and give the people who liked today somewhere
          to be tomorrow.
        </p>
      </Article>
    </>
  );
}
