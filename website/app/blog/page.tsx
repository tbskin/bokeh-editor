import Link from "next/link";
import type { Metadata } from "next";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Plain-language guides on AI content editing, short form video, and building a personal brand.",
  alternates: { canonical: "/blog" },
};

const fmt = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function BlogPage() {
  const ordered = [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return (
    <main style={{ padding: "52px 0 104px" }}>
      <div className="article">
        <h1>Blog</h1>
        <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0" }}>
          {ordered.map((p) => (
            <li key={p.slug} style={{ borderTop: "1px solid var(--line)" }}>
              <Link href={`/blog/${p.slug}`} style={{ textDecoration: "none", display: "block", padding: "24px 0" }}>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--faint)",
                  }}
                >
                  {fmt(p.date)}
                </p>
                <h2 style={{ margin: "0 0 6px" }}>{p.title}</h2>
                <p style={{ margin: 0 }}>{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
