import type { Product } from "@/lib/types";

export function DressArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  const isAline = product.silhouette === "A-line" || product.silhouette === "Fit and flare";
  const isFlowy = product.silhouette === "Flowy";
  const hasPattern = product.pattern !== "Solid";
  const patternId = `pattern-${product.id}`;

  return (
    <svg className={compact ? "dress-art compact" : "dress-art"} viewBox="0 0 260 330" role="img" aria-label={`${product.colour} ${product.silhouette} dress illustration`}>
      <defs>
        <pattern id={patternId} width={product.pattern === "Gingham" || product.pattern === "Plaid" ? 22 : 28} height={product.pattern === "Gingham" || product.pattern === "Plaid" ? 22 : 28} patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill={product.hex} />
          {product.pattern === "Ditsy" && <><circle cx="8" cy="8" r="2.2" fill={product.accent || "#f2afbd"}/><circle cx="21" cy="19" r="3" fill={product.accent || "#f2afbd"}/><path d="M8 10l2 4M21 22l-2 4" stroke="#8daa82" strokeWidth="1.3"/></>}
          {(product.pattern === "Gingham" || product.pattern === "Plaid") && <><rect x="0" y="8" width="30" height="6" fill={product.accent || "#fff"} opacity=".56"/><rect x="8" y="0" width="6" height="30" fill={product.accent || "#fff"} opacity=".56"/></>}
          {product.pattern === "Animal" && <><path d="M3 5c7-5 12 3 7 7S1 13 3 5Zm14 12c7-5 12 3 7 7s-9 1-7-7Z" fill="#2d2824" opacity=".55"/></>}
        </pattern>
        <filter id={`shadow-${product.id}`} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#3e2923" floodOpacity=".12"/></filter>
      </defs>
      <ellipse cx="130" cy="303" rx="65" ry="10" fill="#3d2a25" opacity=".08"/>
      <g filter={`url(#shadow-${product.id})`}>
        {product.sleeve === "Long" && <path d="M95 66 60 92 48 185l25 4 19-84m73-39 35 26 12 93-25 4-19-84" fill={hasPattern ? `url(#${patternId})` : product.hex}/>} 
        {product.sleeve === "3/4" && <path d="M95 67 63 92 55 158l23 4 13-61m74-34 32 25 8 66-23 4-13-61" fill={hasPattern ? `url(#${patternId})` : product.hex}/>} 
        {product.sleeve === "Cap" && <path d="M96 67 69 82l8 29 18-10m69-34 27 15-8 29-18-10" fill={hasPattern ? `url(#${patternId})` : product.hex}/>} 
        <path d={isAline ? "M96 63c12 8 56 8 68 0l8 79c4 35 29 77 44 135-53 17-119 17-172 0 15-58 40-100 44-135Z" : isFlowy ? "M97 63c11 8 55 8 66 0l12 70c14 47 22 96 31 145-50 18-102 18-152 0 9-49 17-98 31-145Z" : "M91 63c18 8 60 8 78 0l10 214c-32 9-66 9-98 0Z"} fill={hasPattern ? `url(#${patternId})` : product.hex}/>
        {product.silhouette === "Fit and flare" && <path d="M82 139c30 8 66 8 96 0" stroke="#fff" opacity=".35" strokeWidth="3"/>}
        {product.neckline === "Square" && <path d="M108 61v25h44V61" fill="#f5ddd2"/>}
        {product.neckline === "Boat" && <path d="M101 63c18 13 40 13 58 0" stroke="#f5ddd2" strokeWidth="8"/>}
        {product.neckline === "Scoop" && <path d="M106 62c4 29 44 29 48 0" fill="#f5ddd2"/>}
        {product.neckline === "Cowl" && <path d="M104 65q26 27 52 0-26 10-52 0Z" fill="#fff" opacity=".32"/>}
        <path d="M98 63c8-9 14-18 14-29h36c0 11 6 20 14 29" fill="#f5ddd2"/>
        <path d="M98 63c8-9 14-18 14-29h36c0 11 6 20 14 29" fill="none" stroke="#d9bdb2" strokeWidth="1" opacity=".6"/>
      </g>
    </svg>
  );
}

