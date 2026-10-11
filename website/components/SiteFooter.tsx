import Link from "next/link";

const linkStyle = {
  color: "var(--muted)",
  textDecoration: "none",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        padding: "22px 28px",
        display: "flex",
        gap: 24,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <Link href="/blog" style={linkStyle}>
        Blog
      </Link>
      <Link href="/faq" style={linkStyle}>
        FAQ
      </Link>
      <span style={{ ...linkStyle, color: "var(--faint)" }}>© 2026 TourByte Inc.</span>
    </footer>
  );
}
