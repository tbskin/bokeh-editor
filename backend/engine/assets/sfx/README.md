# Optional sfx assets

No audio files are bundled in the public repository. The renderer skips missing files.
The `sfx.json` manifest documents supported names and timing/mix settings.

To use audio locally, supply files matching the manifest with a license that permits your
intended use in rendered videos. Tune volume and audition the result with your own footage.
MP3/WAV files are ignored by Git.

Do not commit downloaded audio simply because it is free or royalty-free. Public source
redistribution requires explicit permission. Any proposed bundled asset needs an original
source URL, author, license, and redistribution evidence in `docs/third-party-notices.md`.

You can keep your library outside the checkout by setting `OLE_SFX_DIR` to its absolute
directory, including its `sfx.json` manifest. Only the backend reads this setting.
