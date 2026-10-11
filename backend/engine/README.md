# backend/engine

Editing-engine **module** of the backend service: the deterministic/agentic runtime for voiceover
and talking-head reels.

- Voiceover preserves the existing analyze → plan → recorded/cloned narration → bounded
  render/critique loop.
- Talking head transcribes sources once, retains grouped alternative takes and rejection reasons,
  selects clean complete attempts, then validates semantic continuity and word-safe cut edges.
- `EditDocument` v2 is the shared command target. The model proposes edits; `harness.ts` and `edit-schema.ts` validate
  them; vendored video-use/ffmpeg code renders them. Existing EDLs adapt on their first new edit.
- HyperFrames is restricted to typed `kinetic_text` and `text_card` templates, rendered as cached
  alpha WebM with a kill switch. Arbitrary production HTML is not accepted.

See `../README.md` and `../../docs/CODEMAP.md`.
