# Third-party notices and asset provenance

Original Bokeh code is MIT licensed. These notices preserve the separate terms of material
included directly in the repository.
Installed npm/Python dependencies retain their own package licenses.

## Code and fonts

| Material | Source | Terms and local notice |
| --- | --- | --- |
| Vendored video-use helpers | [browser-use/video-use](https://github.com/browser-use/video-use) | MIT; [included license](../backend/vendor/video-use/LICENSE). See [VENDORED.md](../backend/vendor/video-use/VENDORED.md) for local modifications. |
| Montserrat caption font | [Google Fonts / Montserrat](https://github.com/google/fonts/tree/main/ofl/montserrat) | SIL Open Font License 1.1; [included notice](../backend/vendor/fonts/OFL.txt). |
| Anton font | [Google Fonts / Anton](https://github.com/google/fonts/tree/main/ofl/anton) | SIL Open Font License 1.1; [existing notice](../backend/engine/assets/fonts/OFL.txt). |
| Expo starter material | [Expo](https://github.com/expo/expo) | Preserve the [existing MIT notice](../frontend/LICENSE) credited to 650 Industries. |

The video-use license was retrieved from upstream's license-adding commit
[`fdf749cff9e2477b3092eab0f7e4ccf4afd54e54`](https://github.com/browser-use/video-use/commit/fdf749cff9e2477b3092eab0f7e4ccf4afd54e54).
This identifies the license source, not the exact revision of all vendored helper code.
The Montserrat notice is preserved from [Google Fonts commit 9548902](https://github.com/google/fonts/blob/9548902f8a5a0b4a0bb7427d93347a9ba9fd0f2e/ofl/montserrat/OFL.txt);
its copyright line matches the notice embedded in the bundled font.

## Installed dependencies with separate terms

GSAP 3.14.2 uses its [Standard No Charge license](https://gsap.com/standard-license/), not MIT.
It permits commercial use and AI-generated code, with restrictions for competing visual animation
builders. Review those terms for Bokeh's motion features before claiming an entirely permissive
open-source dependency stack. FFmpeg and native libraries can have LGPL/GPL obligations depending
on their build and how binaries are distributed. Preserve dependency notices in any packaged
release; the root Bokeh license does not replace these terms.

## Public media distribution

The public snapshot excludes the original music, SFX, demonstration reel, photographic reel
covers, internal artifacts, and the copied Humanizer skill whose provenance was incomplete.
Those files are absent from the public Git history as well as the current tree.

Website reel cards use original abstract SVG illustrations created for this release. Bokeh
branding is retained for project identification; the root license does not grant trademark
rights. Use your own branding for a separate product.

Music/SFX support works when an installer supplies assets. Royalty-free use in a finished video
is not necessarily permission to redistribute the original file. For example, the
[Pixabay Content License summary](https://pixabay.com/service/license-summary/) restricts
standalone distribution. Do not treat “free” as CC0 or as a redistribution license.

For any future bundled media, record the source URL, author, applicable license/version,
retrieval date, original filename, local filename, and permission to redistribute the source.
