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
  const torso = `M ${left(widths.shoulder)} 34 Q ${left(widths.waist)} 58 ${left(widths.hip)} 86 L ${right(widths.hip)} 86 Q ${right(widths.waist)} 58 ${right(widths.shoulder)} 34 Q 50 25 ${left(widths.shoulder)} 34 Z`;
  return (
    <svg className={`body-shape-visual ${compact ? "compact" : ""}`} viewBox="0 0 100 120" aria-hidden="true">
      <defs><linearGradient id={`body-${shape.replace(/\s/g, "-")}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a34a69"/><stop offset="1" stopColor="#66203d"/></linearGradient></defs>
      <circle cx="50" cy="15" r="9" fill="#d8b49f"/>
      <path d={torso} fill={`url(#body-${shape.replace(/\s/g, "-")})`} />
      <path d={`M ${left(widths.hip)} 84 L 39 113 M ${right(widths.hip)} 84 L 61 113`} stroke="#70334a" strokeWidth="8" strokeLinecap="round"/>
      <path d={`M ${left(widths.shoulder) + 3} 37 L 15 78 M ${right(widths.shoulder) - 3} 37 L 85 78`} stroke="#8d415d" strokeWidth="7" strokeLinecap="round"/>
      <path d={`M ${left(widths.shoulder)} 34 H ${right(widths.shoulder)} M ${left(widths.hip)} 86 H ${right(widths.hip)}`} stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="3 3"/>
    </svg>
  );
}

type SignalGroup = "undertone" | "depth" | "contrast";

const signalLooks: Record<SignalGroup, Record<string, { skin: string; hair: string; eye: string; accentA: string; accentB: string }>> = {
  undertone: {
    cool: { skin: "#dca98f", hair: "#3b2928", eye: "#3e5968", accentA: "#d8dde1", accentB: "#ffffff" },
    warm: { skin: "#c98d62", hair: "#3f271c", eye: "#5f4a2c", accentA: "#d7ab52", accentB: "#f4e4c7" },
    neutral: { skin: "#aa7355", hair: "#332521", eye: "#494238", accentA: "#c4c6c7", accentB: "#d2a54b" },
  },
  depth: {
    light: { skin: "#efc5ad", hair: "#a36e52", eye: "#70828a", accentA: "#f3d4c3", accentB: "#fff2e8" },
    medium: { skin: "#b87954", hair: "#473026", eye: "#4d5b46", accentA: "#b87954", accentB: "#d29b70" },
    deep: { skin: "#633d31", hair: "#211817", eye: "#31251f", accentA: "#633d31", accentB: "#93634e" },
  },
  contrast: {
    high: { skin: "#e9b99d", hair: "#241a1a", eye: "#26323a", accentA: "#211a1a", accentB: "#f4d4c0" },
    soft: { skin: "#c58b6d", hair: "#866b60", eye: "#6b6761", accentA: "#92766d", accentB: "#cda18a" },
    clear: { skin: "#8f5a43", hair: "#211817", eye: "#2a8380", accentA: "#2a8380", accentB: "#b94567" },
  },
};

export function ColourSignalVisual({ group, value }: { group: SignalGroup; value: string }) {
  const look = signalLooks[group][value] || signalLooks[group][Object.keys(signalLooks[group])[0]];
  return (
    <svg className="colour-signal-visual" viewBox="0 0 140 86" aria-hidden="true">
      <rect width="140" height="86" rx="8" fill="#f5eee8"/>
      <circle cx="20" cy="18" r="11" fill={look.accentA}/><circle cx="119" cy="67" r="13" fill={look.accentB}/>
      <path d="M46 36 C46 9 94 9 94 36 V67 H46Z" fill={look.hair}/>
      <ellipse cx="70" cy="43" rx="20" ry="25" fill={look.skin}/>
      <path d="M50 34 Q70 10 90 34 Q84 20 70 19 Q56 20 50 34" fill={look.hair}/>
      <circle cx="62" cy="42" r="2.2" fill={look.eye}/><circle cx="78" cy="42" r="2.2" fill={look.eye}/>
      <path d="M64 54 Q70 58 76 54" fill="none" stroke="#7d413b" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="9" y="63" width="22" height="8" rx="4" fill={look.accentA}/><rect x="108" y="16" width="22" height="8" rx="4" fill={look.accentB}/>
    </svg>
  );
}

export function PaletteVisual({ colours }: { colours: string[] }) {
  const colourMap: Record<string, string> = { Black: "#1d1b1c", White: "#f8f6ef", Red: "#a21f3f", "Dark pink": "#aa3766", "Jewel tones": "#16666c", Blue: "#245e9a", Grey: "#92989d", Pink: "#d0879f", Taupe: "#968478", Green: "#557d61", "Burnt orange": "#c45c2e", Yellow: "#e0b744", Camel: "#b4875e", Terracotta: "#b4513d", Olive: "#6d7548", Brown: "#684737" };
  return <div className="palette-visual" aria-label={`${colours.join(", ")} palette`}>{colours.map((colour) => <span key={colour} style={{ background: colourMap[colour] || "#7f2146" }} title={colour}/>)}</div>;
}
