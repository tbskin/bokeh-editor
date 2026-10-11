import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bokeh: your AI co-pilot for short form content";

async function loadGoogleFont(family: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!resource) throw new Error(`failed to load font ${family}`);
  return await (await fetch(resource[1])).arrayBuffer();
}

export default async function OpengraphImage() {
  const [serif, grotesk] = await Promise.all([
    loadGoogleFont("Instrument+Serif", "Bokeh"),
    loadGoogleFont("Schibsted+Grotesk", "Your AI co-pilot for short form content"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F1E8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              backgroundColor: "#FFFDF8",
              border: "1px solid #2A251C",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div style={{ width: 58, height: 12, borderRadius: 6, backgroundColor: "#241D16" }} />
            <div style={{ width: 46, height: 12, borderRadius: 6, backgroundColor: "#241D16" }} />
            <div style={{ width: 36, height: 12, borderRadius: 6, backgroundColor: "#A8600A" }} />
          </div>
          <div style={{ fontFamily: "Instrument Serif", fontSize: 150, color: "#241D16" }}>
            Bokeh
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: "Schibsted Grotesk",
            fontSize: 42,
            color: "#6F655A",
          }}
        >
          Your AI co-pilot for short form content
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal" },
        { name: "Schibsted Grotesk", data: grotesk, style: "normal" },
      ],
    }
  );
}
