import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { ContentLoop } from "@/components/blog/visuals";
import { getPost } from "@/lib/posts";

const post = getPost("consistency-is-a-systems-problem")!;

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
          The most common advice about content is also the least useful. Just be consistent. It sounds right and helps
          no one, because it treats a systems problem like a character flaw. People who post consistently are not more
          disciplined than you. They built a process that does not require them to be.
        </p>
        <p>
          Motivation is a terrible thing to depend on. It is high some days and gone others, and any pipeline that only
          runs when you feel inspired will stall the first week you are tired or busy. The creators who show up every
          week are not white knuckling it. They lowered the effort each post takes until showing up stopped requiring a
          heroic mood.
        </p>

        <h2>The loop, and where it breaks</h2>
        <p>
          Content is a loop, not a pile of one-off videos. It runs in five steps: you get an idea, you capture it, you
          edit it, you post it, and you learn from what happened. Then it starts again, ideally a little smarter than
          last time.
        </p>
        <ContentLoop />
        <p>
          Every step has an activation energy, the friction you have to overcome to do it. The loop moves at the speed
          of its highest friction step, the way a chain breaks at its weakest link. For most people the break is between
          capture and edit. Footage gets shot, then it sits, because the edit is where the effort spikes and the whole
          loop jams behind it. Ideas pile up with nowhere to go. That is what falling off actually feels like from the
          inside. It is not a willpower failure. It is a jammed loop.
        </p>

        <h2>Design the friction out</h2>
        <p>
          The fix is not more discipline. It is less friction at each step, so the loop keeps turning even on a bad day.
        </p>
        <p>
          Make ideas cheap to capture, so you are never starting from a blank page. Make capture batchable, so one good
          session feeds several posts. Make the edit as close to automatic as you can, because that is usually the jam.
          Make posting a queue instead of a decision you make live every day. None of this asks you to become a more
          disciplined person. It asks you to build a loop a normal, busy, sometimes tired person can keep turning.
        </p>

        <h2>The step everyone skips</h2>
        <p>
          There is a fifth step most people drop, and it is the one that compounds. Learning. Consistency without
          learning is just noise at volume. You post more and get no better. The version that compounds is a loop where
          the last step feeds the first, where what performed last week quietly shapes what you make next week.
        </p>
        <p>
          This is not mystical. Look at which posts actually got watched, notice what they had in common, and make more
          of that. Check it weekly, not once a quarter, and let the data nudge your ideas instead of guessing. Do that
          for a few months and the loop stops being a treadmill and starts being a flywheel, where each turn makes the
          next one easier and a little more likely to land.
        </p>

        <h2>Ask a better question</h2>
        <p>
          So stop asking how to stay motivated. Motivation is not the input you can control. Ask instead which step in
          your loop needs motivation to happen, and go remove the friction there. Do it enough times and consistency
          stops being something you summon. It becomes something your process produces whether you feel it that day or
          not.
        </p>
        <p>
          The people who make it look effortless are not gritting their teeth. They built a machine that runs on a
          normal amount of willpower. You can build the same one.
        </p>
      </Article>
    </>
  );
}
