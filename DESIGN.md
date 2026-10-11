# Bokeh — Design System

The single source of truth for both visual surfaces. They share **principles** — quiet chrome,
loud content; 9:16 media frames; hard anti-slop discipline — but deliberately diverge
in **palette and type**, because they do different jobs:

- **Marketing website** — *warm editorial*: warm near-black, Instrument Serif display, one amber
  accent. The sections below (Color, Typography, Motion, Components) describe the **website**.
- **Mobile app** — *light native editorial*: soft near-white, graphite actions, bold Schibsted
  Grotesk sans (no serif), and native mobile patterns. See **§ Mobile app** at the end.

Lock these tokens before styling anything. If a screen doesn't use its surface's values, it's wrong.

## Point of view

**Quiet chrome, loud content.** The interface is a calm, dark, editorial canvas. The *color* comes
from the creators' reels themselves — bright, photographic, alive. Chrome stays neutral so the
content sings. One editorial serif voice, technical mono labels, one warm accent. Confident and
content-forward, not decorated.

**The signature moment (website):** vertical **columns of reel cards drifting up and down at
different speeds** — a living wall of short-form video. That is the thing people remember.

## Anti-slop rules (hard)
- **No gradients** (especially blue→purple). No glassmorphism, no neon glow.
- **No Inter / Roboto / Arial / system-font defaults.** Type is chosen, below.
- **No card-grid-everything** (uniform rounded-2xl boxes with shadow). Media frames only.
- **No vague hero copy** ("build the future", "all-in-one", "streamline", "empower").
- **No tiny-uppercase-label directly above a giant headline** (the default AI SaaS hero).
- Color lives in the *content* (reels), not the chrome. Chrome = dark + neutral + one accent.

## Color (chrome only — reels bring their own color)
```
--bg:        #0E0D0C   /* warm near-black canvas */
--surface:   #17140F   /* raised panels */
--line:      rgba(237,231,219,.10)   /* hairline */
--line-2:    rgba(237,231,219,.18)
--text:      #EDE7DB   /* warm off-white */
--muted:     #9C9388
--faint:     #6E665C
--accent:    #E9A23B   /* amber — the website's one signal color */
--accent-ink:#1A1408   /* text on amber */
```
Dark canvas only for the MVP. No light mode yet.

## Typography
- **Display / wordmark:** `Instrument Serif` (400 + italic) — high-contrast editorial serif. This
  is the brand voice; use it big and confident for the wordmark and hero lines.
- **Body / UI:** `Schibsted Grotesk` — clean, characterful grotesque (NOT Inter).
- **Labels / technical / metadata:** `IBM Plex Mono` — uppercase, letter-spaced, small.
- Two weights max per family. Sentence case everywhere except mono labels (which may be UPPERCASE).

## Layout & space
- Editorial, asymmetric, generous negative space around the wordmark; the reels-wall carries the
  density. Don't box everything.
- Radius: `12px` on media frames / reel cards; `10px` on controls. Never uniform rounded-2xl.
- Reel card = a 9:16 media frame, thin `--line` border, modest radius, real reel inside.

## Motion
- **Column drift:** reel columns scroll vertically, alternating direction and speed per column,
  slow and continuous (the signature). Pauses on hover of a card.
- Micro: subtle lift + border brighten on reel hover; buttons depress 1px on press.
- **`prefers-reduced-motion`: freeze all drift**, show a static wall.

## Copy voice
Specific, creator-native, a little bold. Speak to the pain (content is a second job) and the
promise (your voice + your clips → a posted reel). Never generic SaaS. Short, declarative lines.

## Components (shared vocabulary)
- **Wordmark:** "Bokeh" in Instrument Serif + the amber dot.
- **Reel card:** 9:16 frame, `--line` border, `12px` radius, hover-lift.
- **Primary button:** amber fill, `--accent-ink` text, mono label, `10px` radius.
- **Ghost button / link:** `--line-2` border, `--text`, mono label.
- **Mono label:** IBM Plex Mono, 11–12px, `.13em` tracking, `--muted`.

---

## Mobile app — light native editorial

The app expresses the same "quiet chrome, loud content" thesis with **native mobile patterns**,
not website theatrics. Reels are the only decorative color. Chrome is a soft light neutral and
actions are graphite, with red reserved for destructive and recording states. There is no brand
accent, ornamental status rail, or decorative dot. Hierarchy comes from type, spacing, hairlines,
and familiar control states.

### App color (chrome only — reels bring their own color)
```
--app-bg:             #F7F7FB   /* soft neutral canvas */
--app-surface:        #FFFFFF   /* controls / media support */
--app-surface-2:      #F0F0F7   /* grouped and pressed states */
--app-line:           rgba(23,23,31,.08)
--app-line-2:         rgba(23,23,31,.14)
--app-text:           #17171F
--app-muted:          #686875
--app-faint:          #9696A3
--app-action:         #17171F   /* primary control fill; not a brand color */
--app-action-pressed: #30303A
--app-action-ink:     #FFFFFF
--app-selection:      rgba(23,23,31,.06)
--app-danger:         #B83232
```
Light only. Selection is communicated through graphite, neutral fill, weight, and native icons.
Do not introduce a hue merely to make a state look "designed."

### App typography (no serif)
- **Display / wordmark / titles:** Schibsted Grotesk 600–700 — bold modern sans. (Shared family
  with the website's body type, so the two surfaces still rhyme.)
- **Body / UI:** Schibsted Grotesk 400–500.
- **Labels / metadata:** IBM Plex Mono — UPPERCASE, ~11px, `.14em` tracking, `--app-muted`.
- Sentence case everywhere except mono labels. No Inter/system defaults, no serif.

### App layout, navigation & motion
- Content-forward. Home is a **2-column wall of 9:16 reel tiles**; each tile is a media frame with
  its live status overlaid in white neutral type.
- **Navigation:** header (wordmark + settings icon) + the primary create action as a **floating
  action button (FAB)** pinned **bottom-right** (graphite circle, white plus, ~56px). No bottom tab bar —
  Home and Settings are the only destinations; the new-reel flow and reel detail are pushed (stack)
  screens.
- **Radius:** 14 on reel tiles / media, 12 on controls, pill on status chips, circular FAB.
- **Motion:** native and restrained — opacity/background feedback, sheet slide-ups, cross-fades.
  Respect reduced-motion preferences.

### App components
- **Shared primitives:** `Controls.tsx` owns app headers, icon buttons, text fields, and segmented
  controls. Do not restyle these per screen.
- **Wordmark:** plain "Bokeh" in Schibsted Grotesk 600. No dot or other brand garnish.
- **Reel tile:** 9:16 media frame, radius 14, thin `--app-line`, status overlay (above).
- **FAB:** graphite circle, white plus, bottom-right, ~56px.
- **Buttons:** one shared button primitive. Primary = graphite fill + white text; secondary = white
  fill + `--app-line-2` border. Radius 12. Disabled state uses opacity, not a new color.
- **Text field:** white surface, `--app-line-2` border, radius 12, consistent 48px minimum height.
- **Segmented control:** neutral grouped track with a white selected segment; no underline or hue.
- **Mono label:** IBM Plex Mono, ~11px, `.14em` tracking, `--app-muted`.
- **Stage checklist:** grouped rows with a checkmark, native spinner, or pending circle. Active text
  gets weight and an optional numeric percentage. No connecting rail, filled status badge, nested
  progress bar, or active-side border.
- **Progress bar:** a 2px graphite bar used only for truly continuous standalone uploads.
