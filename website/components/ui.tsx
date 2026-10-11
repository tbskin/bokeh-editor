export function Wordmark({ size = 28 }: { size?: number }) {
  const tile = Math.round(size * 1.2);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.42) }}>
      <svg width={tile} height={tile} viewBox="0 0 512 512" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
        <rect x="4" y="4" width="504" height="504" rx="114" fill="var(--surface)" stroke="var(--line-2)" strokeWidth="8" />
        <rect x="136" y="148" width="240" height="48" rx="24" fill="var(--text)" />
        <rect x="161" y="232" width="190" height="48" rx="24" fill="var(--text)" />
        <rect x="181" y="316" width="150" height="48" rx="24" fill="var(--accent)" />
      </svg>
      <span style={{ fontFamily: "var(--font-display), serif", fontSize: size, lineHeight: 1 }}>
        Bokeh
      </span>
    </span>
  );
}

export function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 12,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      {children}
    </span>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <a href={href} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"}`}>
      {children}
    </a>
  );
}
