import Link from "next/link";
import { Wordmark } from "./ui";

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--line)" }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" aria-label="Bokeh home" style={{ textDecoration: "none", color: "var(--text)" }}>
          <Wordmark size={22} />
        </Link>
        <Link
          href="/blog"
          style={{
            color: "var(--muted)",
            textDecoration: "none",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Blog
        </Link>
      </div>
    </header>
  );
}
