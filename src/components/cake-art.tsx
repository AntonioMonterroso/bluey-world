import { FROSTINGS } from "@/lib/game/cake";
import { cn } from "@/lib/utils";

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(" ");

const SPRINKLES: [number, number, string][] = [
  [72, 70, "#ff6b9a"], [88, 64, "#ffd166"], [104, 72, "#6bcbef"], [120, 66, "#a78bfa"], [132, 74, "#ff6b9a"],
  [64, 106, "#6bcbef"], [90, 112, "#ffd166"], [116, 108, "#ff6b9a"], [144, 112, "#a78bfa"], [78, 98, "#ffd166"], [126, 96, "#6bcbef"],
];

/** Torta de dos pisos que se va armando con la crema y los adornos que elijas. */
export function CakeArt({ frosting, toppings, className }: { frosting: string | null; toppings: string[]; className?: string }) {
  const color = FROSTINGS.find((f) => f.id === frosting)?.color ?? "#f3e3c9";
  const has = (t: string) => toppings.includes(t);
  return (
    <svg viewBox="0 0 200 150" role="img" aria-label="Tu torta" className={cn("h-auto w-full", className)}>
      <ellipse cx="100" cy="134" rx="84" ry="9" fill="rgba(0,0,0,.08)" />
      <ellipse cx="100" cy="128" rx="80" ry="8" fill="#fff" stroke="#d9d2dd" strokeWidth="1.5" />

      {/* piso de abajo */}
      <rect x="32" y="84" width="136" height="44" rx="10" fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      <path d="M32 98 q10 8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t16 0" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="5" strokeLinecap="round" />
      {/* piso de arriba */}
      <rect x="56" y="54" width="88" height="34" rx="9" fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      <path d="M56 66 q8 7 16 0 t16 0 t16 0 t16 0 t16 0 t8 0" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="4.5" strokeLinecap="round" />

      {has("chispas") && SPRINKLES.map(([x, y, c], i) => <rect key={i} x={x} y={y} width="7" height="2.6" rx="1.3" fill={c} transform={`rotate(${(i * 47) % 180} ${x + 3} ${y + 1})`} />)}

      {has("fresas") && [46, 72, 128, 154].map((x) => (
        <g key={x}>
          <path d={`M${x - 8} 80 q8 -6 16 0 q-2 14 -8 14 q-6 0 -8 -14z`} fill="#e63950" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
          <path d={`M${x - 6} 80 l6 -5 l6 5z`} fill="#3fae5a" />
          <circle cx={x - 2} cy="85" r="0.9" fill="#fff" opacity=".8" /><circle cx={x + 3} cy="88" r="0.9" fill="#fff" opacity=".8" />
        </g>
      ))}

      {has("cerezas") && [88, 112].map((x) => (
        <g key={x}>
          <path d={`M${x} 52 q4 -14 12 -16`} fill="none" stroke="#3f7a3f" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx={x} cy="53" r="6.5" fill="#b3122e" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
          <circle cx={x - 2} cy="51" r="1.6" fill="#fff" opacity=".7" />
        </g>
      ))}

      {has("velas") && [80, 100, 120].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y="28" width="6" height="25" rx="1.5" fill={["#7fd1ff", "#ffd166", "#ff9ab8"][i]} stroke="rgba(0,0,0,.25)" strokeWidth="1" />
          <path d={`M${x} 18 q4 6 0 10 q-4 -4 0 -10z`} fill="#ffb02e" stroke="#f08a00" strokeWidth="0.8" />
        </g>
      ))}

      {has("flores") && [62, 100, 138].map((x) => (
        <g key={x}>
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 5 * Math.cos((a * Math.PI) / 180)} cy={112 + 5 * Math.sin((a * Math.PI) / 180)} r="3.4" fill="#fff" stroke="#e9a8c6" strokeWidth="0.8" />)}
          <circle cx={x} cy="112" r="2.6" fill="#ffc83d" />
        </g>
      ))}

      {!frosting && toppings.length === 0 && <text x="100" y="40" textAnchor="middle" fontSize="9" fill="#9a8fa0">Elige la crema y los adornos</text>}
    </svg>
  );
}
export { star };
