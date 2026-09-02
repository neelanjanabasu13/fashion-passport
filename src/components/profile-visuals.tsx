const bodyPoints: Record<string, { shoulder: number; waist: number; hip: number }> = {
  "Inverted triangle": { shoulder: 34, waist: 20, hip: 25 },
  Pear: { shoulder: 25, waist: 19, hip: 34 },
  Hourglass: { shoulder: 31, waist: 16, hip: 31 },
  Rectangle: { shoulder: 27, waist: 24, hip: 27 },
  Apple: { shoulder: 27, waist: 33, hip: 26 },
};

export function BodyShapeVisual({ shape, compact = false }: { shape: string; compact?: boolean }) {
  const widths = bodyPoints[shape] || bodyPoints.Rectangle;
  const left = (width: number) => 50 - width;
  const right = (width: number) => 50 + width;
  const torso = `M ${left(widths.shoulder)} 22 C ${left(widths.shoulder)} 32 ${left(widths.waist)} 42 ${left(widths.waist)} 55 C ${left(widths.waist)} 69 ${left(widths.hip)} 75 ${left(widths.hip)} 91 Q 50 105 ${right(widths.hip)} 91 C ${right(widths.hip)} 75 ${right(widths.waist)} 69 ${right(widths.waist)} 55 C ${right(widths.waist)} 42 ${right(widths.shoulder)} 32 ${right(widths.shoulder)} 22 Q 50 15 ${left(widths.shoulder)} 22 Z`;
  return (
    <svg className={`body-shape-visual ${compact ? "compact" : ""}`} viewBox="0 0 100 120" aria-hidden="true">
      <path d={torso} fill="#f4e4e8" stroke="#7f2146" strokeWidth="2.5" />
      <path d={`M ${left(widths.shoulder)} 22 H ${right(widths.shoulder)} M ${left(widths.waist)} 55 H ${right(widths.waist)} M ${left(widths.hip)} 88 H ${right(widths.hip)}`} stroke="#7f2146" strokeWidth="1.4" strokeDasharray="3 2"/>
      <circle cx={left(widths.shoulder)} cy="22" r="2" fill="#7f2146"/><circle cx={right(widths.shoulder)} cy="22" r="2" fill="#7f2146"/>
      <circle cx={left(widths.waist)} cy="55" r="2" fill="#7f2146"/><circle cx={right(widths.waist)} cy="55" r="2" fill="#7f2146"/>
      <circle cx={left(widths.hip)} cy="88" r="2" fill="#7f2146"/><circle cx={right(widths.hip)} cy="88" r="2" fill="#7f2146"/>
      {!compact && <><text x="4" y="25">S</text><text x="4" y="58">W</text><text x="4" y="91">H</text></>}
    </svg>
  );
}

type SignalGroup = "undertone" | "depth" | "contrast";

export function ColourSignalVisual({ group, value }: { group: SignalGroup; value: string }) {
  const undertone: Record<string, string[]> = { cool: ["#c8ced5", "#ffffff", "#e8b7aa", "#9c665c"], warm: ["#d9aa43", "#f6e7c8", "#e5ad82", "#9d603f"], neutral: ["#c8ced5", "#d9aa43", "#d3a083", "#80503d"] };
  const depth: Record<string, string[]> = { light: ["#f7dfd1", "#efc4aa", "#dca27f", "#b97855"], medium: ["#edc7ad", "#d99d78", "#b97855", "#925d43"], deep: ["#ad7154", "#81503e", "#5d382e", "#321f1c"] };
  const contrast: Record<string, string[]> = { high: ["#171515", "#fbf8ef", "#9d244c", "#f1c8ae"], soft: ["#7f706c", "#b8a29a", "#d8b8a7", "#eee2d8"], clear: ["#147d83", "#b7265a", "#f1bf2f", "#f8f3e8"] };
  const swatches = (group === "undertone" ? undertone : group === "depth" ? depth : contrast)[value];
  return (
    <svg className="colour-signal-visual" viewBox="0 0 140 86" aria-hidden="true">
      <rect width="140" height="86" rx="8" fill="#f6f1eb"/>
      {swatches.map((colour, index) => <rect key={colour} x={8 + index * 31} y="10" width="27" height="66" rx="13.5" fill={colour}/>) }
      <path d="M8 68 Q70 45 132 68" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2"/>
    </svg>
  );
}

export const COLOUR_SWATCHES: Record<string, string> = { Black: "#1d1b1c", White: "#f8f6ef", Red: "#a21f3f", "Dark pink": "#aa3766", "Jewel tones": "linear-gradient(135deg,#173f8a,#14766c,#713987)", Blue: "#245e9a", Grey: "#92989d", Pink: "#d0879f", Taupe: "#968478", Green: "#557d61", "Burnt orange": "#c45c2e", Orange: "#e87937", Yellow: "#e0b744", Camel: "#b4875e", Terracotta: "#b4513d", Olive: "#6d7548", Brown: "#684737", Navy: "#172d53", Purple: "#6c3b78", Multi: "linear-gradient(135deg,#a21f3f 0 25%,#e0b744 25% 50%,#245e9a 50% 75%,#557d61 75%)" };

export function PaletteVisual({ colours }: { colours: string[] }) {
  return <div className="palette-visual" aria-label={`${colours.join(", ")} palette`}>{colours.map((colour) => <span key={colour} style={{ background: COLOUR_SWATCHES[colour] || "#7f2146" }} title={colour}/>)}</div>;
}
