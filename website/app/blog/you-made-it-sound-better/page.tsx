import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { JsonLd } from "@/components/JsonLd";
import { getPost } from "@/lib/posts";

const post = getPost("you-made-it-sound-better")!;

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
          You wrote the caption yourself first. It came out a little clumsy, maybe too long, so you pasted it into the
          chatbot and asked it to clean it up. What came back was smoother. Shorter, with the awkward parts gone, nothing
          left to trip on. You read it, thought that is better, and posted that one. It is the same small flinch every
          time: this is fine, but it is not good enough to put my name on, so you hand it to something that writes
          cleaner than you do.
        </p>
        <p>The clumsy version was probably the one that would have worked.</p>

        <h2>What you actually deleted</h2>
        <p>
          The rough draft had your fingerprints on it. The word you would actually use out loud. The weirdly specific
          example. The sentence that ran long because you were figuring the thought out while you typed it. Those are
          not mistakes to fix. They are the proof that a particular person was there and meant what they said. You wrote
          that a room looked gray and a bit sad, like a dentist&apos;s waiting room. The clean version said the lighting
          felt flat and uninviting. One of those is a person. The other is a help article.
        </p>
        <p>
          When a model tidies your writing, the one thing it is built to do is pull your words toward the most ordinary
          way to say them. A study of heavy AI users writing essays found their work used about{" "}
          <a
            href="https://www.nbcnews.com/tech/tech-news/ai-changing-style-substance-human-writing-study-finds-rcna263789"
            target="_blank"
            rel="noopener noreferrer"
          >
            50 percent fewer pronouns
          </a>{" "}
          and carried fewer anecdotes and references to real human experience. Words like I and you are how a person
          actually shows up in a sentence, and the cleanup quietly strains them out.
        </p>
        <p>
          So you did not make it better. You made it more average. And average is the one thing a feed already full of
          machine-written text cannot reward, because it has no way to tell your version apart from the thousand others
          that were written the same way.
        </p>

        <h2>Everyone who does this lands in the same place</h2>
        <p>
          When different people lean on the same assistant, they start to write the same. Researchers at Cornell had
          Americans and people in India write with an AI helper and found their writing{" "}
          <a
            href="https://news.cornell.edu/stories/2025/04/ai-suggestions-make-writing-more-generic-western"
            target="_blank"
            rel="noopener noreferrer"
          >
            drifted toward the same generic, Americanized middle
          </a>
          , with the Indian writers giving up more of their own style to get there. That is the tool working exactly as
          designed. It guesses the most likely next words, and the most likely words are the ones everybody already
          uses.
        </p>
        <p>
          Which turns the whole move inside out. The thing you opened the chatbot to get, sounding more polished and
          more like real content, is the exact thing that makes you sound like everyone else who opened it for the same
          reason. Left alone, human writing stays{" "}
          <a
            href="https://www.ucc.ie/en/news/2025/new-study-reveals-that-ai-cannot-fully-write-like-a-human.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            varied and full of individual quirks
          </a>{" "}
          while machine text clusters into a few tight, predictable shapes. The quirks were yours. The cleanup trades
          them for the cluster.
        </p>

        <h2>Smooth does not read the way it used to</h2>
        <p>
          There is a second cost, and it is newer. People have gotten quick at catching that smooth, frictionless
          machine tone, and when they catch it they trust the thing less. A 2025 Gartner survey found{" "}
          <a
            href="https://www.gartner.com/en/newsroom/press-releases/2025-09-03-gartner-survey-finds-53-percent-of-consumers-distrust-ai-powered-search-results0"
            target="_blank"
            rel="noopener noreferrer"
          >
            53 percent of people already distrust AI-powered answers
          </a>
          . Other research found{" "}
          <a
            href="https://www.klaviyo.com/solutions/ai/consumer-trust-in-ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            58 percent trust a brand less
          </a>{" "}
          once they realize its content was AI-made, and a 2025 study from the Nuremberg Institute found that simply
          telling people an ad was AI-generated made them rate it as{" "}
          <a
            href="https://www.nim.org/en/publications/detail/transparency-without-trust"
            target="_blank"
            rel="noopener noreferrer"
          >
            less natural and less useful
          </a>
          .
        </p>
        <p>
          And the taste has turned the other way. After a year of feeds flooded with generated posts, Digiday reported
          that audiences are now{" "}
          <a
            href="https://digiday.com/media/after-an-oversaturation-of-ai-generated-content-creators-authenticity-and-messiness-are-in-high-demand/"
            target="_blank"
            rel="noopener noreferrer"
          >
            seeking out creators whose work is a little messy
          </a>
          , because anything overpolished starts to look like something a machine made. The texture you sanded off was
          doing a quiet job the whole time. It told a stranger that a real person was here. Take it out and the post
          could have come from anywhere, which a reader tends to read as coming from no one.
        </p>

        <h2>Point it at the part that was never you</h2>
        <p>
          None of this means you have to swear off the tool. It means aim it at the right layer. There is a mechanical
          layer in writing, the same way there is in editing: a typo, or a sentence you genuinely mangled. Clean those
          and nobody loses anything, because that part was never you to begin with. Then there is the layer that carries
          your actual point, your reasons, the example only you would have reached for, the opinion you are a little
          nervous to say flat out. Leave that one rough. Rough was never the problem. Generic is.
        </p>
        <p>
          A test that holds up: read your version and the cleaned-up version out loud, one after the other. Keep the one
          that sounds like you actually talking, even when it is the clumsier of the two, because that is the one a
          stranger will believe. A model is very good at making something correct. It cannot make something yours, and
          yours was the only version worth posting.
        </p>
        <p>
          The chatbot will hand you a cleaner draft every time you ask for one. That was never the hard part. The hard
          part is having one thing to say that only you would have said, in the words you would actually use, and that
          is the exact thing you keep pasting in and asking it to take back out.
        </p>
      </Article>
    </>
  );
}
