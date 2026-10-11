export const color = {
  bg: "#F7F7FB",
  surface: "#FFFFFF",
  surface2: "#F0F0F7",
  text: "#17171F",
  muted: "#686875",
  faint: "#9696A3",
  action: "#0BA55D",
  actionPressed: "#078A4D",
  actionInk: "#FFFFFF",
  actionWash: "rgba(11,165,93,0.10)",
  selection: "rgba(23,23,31,0.06)",
  danger: "#B83232",
  dangerWash: "rgba(184,50,50,0.08)",
  rec: "#FF453A", // active-recording red (functional, not a brand accent)
  line: "rgba(23,23,31,0.08)",
  line2: "rgba(23,23,31,0.14)",
  overlay: "rgba(23,23,31,0.66)",
  scrim: "rgba(0,0,0,0.55)",
  onMedia: "#FFFFFF",
  onMediaMuted: "rgba(255,255,255,0.72)",
} as const;

export const radius = { tile: 14, control: 12, chip: 999 } as const;

export const font = {
  display: "SchibstedGrotesk_600SemiBold",
  bodyBold: "SchibstedGrotesk_500Medium",
  body: "SchibstedGrotesk_400Regular",
  mono: "IBMPlexMono_400Regular",
} as const;

export const space = (n: number) => n * 4;
