# frontend

The mobile client — a **thin** capture / record / preview / chat surface. All heavy lifting lives
in the cloud engine.

- Stack: Expo (React Native), TypeScript
- Responsibilities: light-only project hub, Voiceover/Talking-head format choice, camera-roll
  picker, direct resumable upload, persistent project conversation, teleprompter or generated-voice
  preview for voiceover only, reel playback, chat edits, one-step undo, export / share
- Deploys via: EAS build → App Store / Play Store (not Vercel)
- Status: implemented; physical-iPhone founder/TestFlight validation is the release gate
