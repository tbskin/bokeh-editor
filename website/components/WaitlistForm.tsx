"use client";

import { useState } from "react";

// Optional: submissions go to the deployment owner's Web3Forms account.
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

type State = "idle" | "loading" | "done" | "error";

export function WaitlistForm({ align = "center" }: { align?: "left" | "center" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const justify = align === "left" ? "flex-start" : "center";
  const mx = align === "left" ? "0" : "0 auto";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!WEB3FORMS_KEY) return;
    setState("loading");
    try {
      const formData = new FormData();
      formData.append("access_key", WEB3FORMS_KEY);
      formData.append("email", email);
      formData.append("subject", "New Bokeh waitlist signup");
      formData.append("from_name", "Bokeh waitlist");
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
      const data = await res.json();
      setState(data.success ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (!WEB3FORMS_KEY) {
    return <a href="https://github.com/tbskin/bokeh-editor" className="btn btn-primary">Explore the project</a>;
  }

  if (state === "done") {
    return (
      <p style={{ color: "var(--text)", fontSize: 16, margin: mx, maxWidth: 460, textAlign: align }}>
        You&rsquo;re on the list. We&rsquo;ll be in touch soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", gap: 10, justifyContent: justify, flexWrap: "wrap", maxWidth: 460, margin: mx }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="wl-input"
      />
      <button type="submit" className="btn btn-primary" disabled={state === "loading"}>
        {state === "loading" ? "Joining" : "Join the waitlist"}
      </button>
      {state === "error" && (
        <span style={{ flexBasis: "100%", color: "var(--muted)", fontFamily: "var(--font-mono), monospace", fontSize: 12, textAlign: align }}>
          Something went wrong. Please try again.
        </span>
      )}
    </form>
  );
}
