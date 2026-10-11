# Bokeh — icon pack

The brand mark: three caption bars (subtitle lines), the last one in amber — the final edit before you post.

## Colors
- Tile / background: `#17140F`
- Bars: `#EDE7DB` (warm off-white)
- Accent (last bar): `#E9A23B` (amber)

## Files
| File | Use |
| --- | --- |
| `icon.svg` | **Primary.** Rounded tile, full color. Favicon and general use. |
| `icon-square.svg` | Full-bleed square (no rounded corners). Source for app / maskable icons — iOS and Android apply their own mask. |
| `icon-mark.svg` | Bars only, transparent background, keeps the amber. For placing the mark inline on any background. |
| `icon-mono.svg` | Bars only, `currentColor`, transparent. Single-ink contexts; inherits the surrounding text color. |
| `icon-16.png`, `icon-32.png` | Favicon raster fallbacks (rounded, transparent). |
| `icon-180.png` | Apple touch icon (opaque square). |
| `icon-192.png`, `icon-512.png` | PWA / Android / large (opaque square). |

The **SVGs are the source of truth**. To regenerate the PNGs: render the rounded SVG for favicons and the square SVG for app icons, at 512px or larger, then downscale (headless Chrome clips windows smaller than ~500px, so render big and resize down).

Wired into the website via `website/app/icon.svg` and `website/app/apple-icon.png` (Next.js App Router auto-detects both).
