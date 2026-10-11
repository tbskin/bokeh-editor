# Build your own mobile app

1. Complete [the setup guide](../docs/technical-guide.md), including your own Supabase and API.
2. In `app.json`, choose your own slug, URL scheme, iOS bundle identifier, and Android package.
   The `com.example.bokeheditor` values are placeholders, not store-ready identities.
3. Run `eas login` and `eas init` from this directory to link **your** Expo project.
4. In EAS, create development/preview/production environment variables for `EXPO_PUBLIC_API_URL`,
   `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Add analytics only if wanted.
   Client variables are public; never add server secrets here.
5. Run `eas build --profile development --platform ios` (or Android) and follow account/provisioning prompts.
6. Test sign-in, upload, recording, rendering, playback, saving, and sharing on a physical phone.
7. Use `eas build --profile production --platform ios` and your own App Store Connect account for
   distribution. Apple/Google enrollment and review are separate from this repository.

EAS profiles contain no Bokeh account IDs, backend URLs, or embedded service keys.
