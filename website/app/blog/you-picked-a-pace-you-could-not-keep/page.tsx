import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-picked-a-pace-you-could-not-keep")!;

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
          You started strong. The first week you posted five times, right on the schedule you set for yourself. The second
          week you managed four. By week six you missed a couple of days in a row, felt like you had blown it, and a month
          later the account had gone quiet. You filed it under lost motivation and moved on.
        </p>
        <p>
          But you did not lose motivation. You lost a bet you placed back in week one, before you had posted anything, in
          the calm moment when you decided how often you were going to do this. You picked a number. The number was too
          big for your actual life. Everything that happened after was that number coming to collect.
        </p>

        <h2>You copied a full-time schedule</h2>
        <p>
          Notice where your number even came from. You almost certainly did not arrive at it by looking honestly at your
          own week. You absorbed it. Post every day. Three to five times a week at the very least. The platforms push the
          same line, and TikTok will happily tell you to post{" "}
          <a
            href="https://buffer.com/resources/how-often-should-you-post-on-tiktok/"
            target="_blank"
            rel="noopener noreferrer"
          >
            one to four times a day
          </a>
          .
        </p>
        <p>
          Now look at who those numbers describe. They come from people who make content for a living, or from brands with
          a person whose entire job is the account. Their daily post sits inside a workday built around posting. Yours sits
          on top of a job, a commute, and everyone else who needs something from you. The same number means two completely
          different things, and you took the one written for a life that looks nothing like yours.
        </p>
        <p>
          The strange part is that the big number was not even buying you much. When Buffer went through more than eleven
          million posts, the real jump in results came from moving from one post a week to somewhere between{" "}
          <a
            href="https://buffer.com/resources/how-often-should-you-post-on-tiktok/"
            target="_blank"
            rel="noopener noreferrer"
          >
            two and five
          </a>
          . After that it flattens out fast. So the daily grind you signed up for, the one that eventually wore you down,
          was mostly you climbing past the point where extra posting had stopped paying you back.
        </p>

        <h2>You did the math on your best day</h2>
        <p>
          Say you settled on five a week and it felt reasonable at the time. Here is why it felt reasonable and then was
          not. When you pictured a single post, you pictured the easy version. Film it, cut it, put it up. Twenty minutes,
          maybe thirty. You did not picture the take you had to redo four times, the caption that would not come out right,
          or the night you got home worn out and could not make the idea come.
        </p>
        <p>
          This is not you being bad at planning. It is one of the most reliable ways a human mind gets things wrong. It has
          a name, the{" "}
          <a href="https://thedecisionlab.com/biases/planning-fallacy" target="_blank" rel="noopener noreferrer">
            planning fallacy
          </a>
          , and Kahneman and Tversky pinned it down decades ago. We lowball how long our own tasks will take, even when we
          can clearly remember the last one running long, because we plan for the version where nothing goes sideways. The
          odd twist is that it only happens to us about our own work. Ask an outsider how long your post will take and they
          guess high. You are the one who guesses low, and you are the one setting the schedule.
        </p>
        <p>
          So the pace that looked doable was built on a fantasy week where every post is the quick one. Real weeks are not
          made of quick ones. The schedule was already broken on the day you wrote it down. It just took one bad Tuesday
          for you to find out.
        </p>

        <h2>The miss was never the problem</h2>
        <p>
          Then you miss a day. On a real schedule wrapped around a real life, you always eventually miss a day. And here is
          where the ambitious number does its quietest damage, because it turns one skipped post into a verdict. You did
          not just skip a day. You broke the streak. You are not the kind of person who follows through. So why keep
          pretending.
        </p>
        <p>
          That feeling is doing all the harm, and it is aimed at the wrong thing. A single missed day barely matters. When
          Phillippa Lally tracked people trying to build new habits, one skipped day made{" "}
          <a
            href="https://taskcoach.ai/blog/habit-formation-real-curve-lally-66-days/"
            target="_blank"
            rel="noopener noreferrer"
          >
            no real dent
          </a>{" "}
          in the long run. What ended things was never the miss. It was quitting in response to the miss, the all or
          nothing story that reads a broken run as a failed one. A pace pitched too high manufactures that story over and
          over, because it is impossible to hold perfectly, so it keeps handing you fresh proof that you failed until you
          believe it and stop.
        </p>

        <h2>Pick the pace for your worst week</h2>
        <p>
          So set the number a different way. Not for the version of you doing the planning, rested and a little excited on
          a Sunday afternoon. For the tired version who has to actually carry it out on a Wednesday in month four, with a
          cold and a deadline and no ideas. Pick the pace that person could keep. That is your real number, and it is
          almost always lower than the one you would set on the Sunday.
        </p>
        <p>
          It will feel like too little. Once or twice a week, while everyone online is shouting daily, feels like you are
          barely in the game. That feeling is the trap talking. A slow pace you actually hold beats a fast one you abandon,
          and it is not close, because the abandoned one drops to zero and stays there. The whole thing rewards the account
          still showing up a year from now, and almost nobody is. Being one of the few still there is worth more than any
          burst of frequency you cannot repeat.
        </p>
        <p>
          Build a little slack in while you are at it. Bank a couple of posts ahead so a rough week costs you nothing.
          Decide in advance that missing one is allowed, that you simply go again the next day instead of letting the gap
          mean something about who you are. A schedule with room in it is one you can keep, and the kind you can keep is the
          only kind that ever compounds.
        </p>
        <p>
          You did not run out of discipline. You were carrying a number that belonged to someone else, on a week that only
          ever existed in your head. Put the number down and pick one your worst week can hold, and the thing you kept
          failing at quietly turns into the thing you just do.
        </p>
      </Article>
    </>
  );
}
