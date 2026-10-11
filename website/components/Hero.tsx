import { Wordmark } from "./ui";
import { WaitlistForm } from "./WaitlistForm";

export function Hero() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        padding: "48px 0",
        maxWidth: 560,
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <Wordmark />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 400,
          fontSize: "clamp(44px, 6.5vw, 78px)",
          lineHeight: 1.0,
          margin: "0 0 20px",
        }}
      >
        Now, anyone
        <br />
        can create.
      </h1>
      <p style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 30px", maxWidth: 460 }}>
        Your AI co-pilot for short form content. Bring your clips and it edits them into a finished,
        post-ready reel.
      </p>
      <WaitlistForm align="left" />
    </div>
  );
}
