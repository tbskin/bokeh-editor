import Link from "next/link";

export function Article({
  title,
  date,
  author,
  children,
}: {
  title: string;
  date: string;
  author: string;
  children: React.ReactNode;
}) {
  const pretty = new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <main style={{ padding: "52px 0 104px" }}>
      <article className="article">
        <h1>{title}</h1>
        <p className="byline">
          By {author} · {pretty}
        </p>
        {children}
        <p style={{ marginTop: 48 }}>
          <Link href="/">Back to Bokeh</Link>
        </p>
      </article>
    </main>
  );
}
