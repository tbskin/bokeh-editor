import { Wordmark, MonoLabel } from "./ui";
import { WaitlistForm } from "./WaitlistForm";

export function Footer() {
  return (
    <footer id="waitlist" style={{ borderTop: "1px solid var(--line)", padding: "80px 28px", textAlign: "center" }}>
      <Wordmark size={40} />
      <p style={{ color: "var(--muted)", margin: "18px auto 26px", maxWidth: 440, lineHeight: 1.5 }}>
        Become the creator you keep meaning to be. Turn today&rsquo;s clips into a reel worth posting.
      </p>
      <WaitlistForm />
      <div style={{ marginTop: 40 }}>
        <MonoLabel>© 2026 Bokeh</MonoLabel>
      </div>
    </footer>
  );
}
