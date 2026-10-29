import type { ReactNode } from "react";
import type { Anchors } from "@/lib/game/anchors";

/** Medidas ya convertidas a unidades del dibujo (ancho = 100). */
export interface ArtCtx {
  W: number;
  H: number;
  cx: number; // centro de la cabeza
  top: number; // arriba del cráneo
  u: number; // ancho de la cabeza
  ey: number; // ojos
  tx: number; // centro del torso
  tt: number; // arriba del torso
  tb: number; // abajo del torso
  tw: number; // ancho del torso
  h: number; // alto del torso
  hl: number; // mano izquierda (x)
  hr: number; // mano derecha (x)
  hy: number; // altura de las manos
  fl: number; // pie izquierdo (x)
  fr: number; // pie derecho (x)
  fy: number; // altura de los pies
}

export function makeCtx(a: Anchors, aspect: number): ArtCtx {
  const W = 100;
  const H = 100 * aspect;
  return { W, H, cx: a.hx * W, top: a.hy * H, u: a.hw * W, ey: a.ey * H, tx: a.tx * W, tt: a.tt * H, tb: a.tb * H, tw: a.tw * W, h: (a.tb - a.tt) * H, hl: a.tx * W - 0.62 * a.tw * W, hr: (a.hrx ?? a.tx + 0.62 * a.tw) * W, hy: (a.hry ?? a.tt + 0.6 * (a.tb - a.tt)) * H, fl: ((a.fx ?? a.tx) - (a.fs ?? 0.2 * a.tw)) * W, fr: ((a.fx ?? a.tx) + (a.fs ?? 0.2 * a.tw)) * W, fy: (a.fy ?? 0.94) * H };
}

const P = { fill: "var(--primary)" } as const;
const PS = { stroke: "var(--primary)" } as const;
const LINE = "rgba(0,0,0,.28)";
const GOLD = "#f6c744";
const GOLD_D = "#c99a1e";

const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + rr * Math.cos(ang)},${cy + rr * Math.sin(ang)}`;
  }).join(" ");

const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.35} C${x - s} ${y - s * 0.3} ${x - s * 0.5} ${y - s} ${x} ${y - s * 0.45} C${x + s * 0.5} ${y - s} ${x + s} ${y - s * 0.3} ${x} ${y + s * 0.35}Z`;

function Flower({ x, y, r, c }: { x: number; y: number; r: number; c: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + r * 1.05 * Math.cos((a * Math.PI) / 180)} cy={y + r * 1.05 * Math.sin((a * Math.PI) / 180)} r={r} fill={c} stroke={LINE} strokeWidth={0.2} />
      ))}
      <circle cx={x} cy={y} r={r * 0.8} fill={GOLD} />
    </g>
  );
}

export interface Art {
  layer: "back" | "front";
  render: (c: ArtCtx) => ReactNode;
}

export const ART: Record<string, Art> = {
  // ---------- Cabeza ----------
  "wear:lazo": {
    layer: "front",
    render: ({ cx, top, u }) => {
      const x = cx + 0.24 * u, y = top + 0.0 * u;
      return (
        <g>
          <polygon points={`${x},${y} ${x - 0.2 * u},${y - 0.12 * u} ${x - 0.2 * u},${y + 0.12 * u}`} {...P} stroke={LINE} strokeWidth={0.3} />
          <polygon points={`${x},${y} ${x + 0.2 * u},${y - 0.12 * u} ${x + 0.2 * u},${y + 0.12 * u}`} {...P} stroke={LINE} strokeWidth={0.3} />
          <circle cx={x} cy={y} r={0.06 * u} fill="#fff" stroke={LINE} strokeWidth={0.3} />
        </g>
      );
    },
  },
  "wear:mono": {
    layer: "front",
    render: ({ cx, top, u }) => (
      <g>
        <path d={`M${cx} ${top - 0.02 * u} L${cx - 0.34 * u} ${top - 0.22 * u} Q${cx - 0.4 * u} ${top - 0.02 * u} ${cx - 0.34 * u} ${top + 0.16 * u} Z`} {...P} stroke={LINE} strokeWidth={0.3} />
        <path d={`M${cx} ${top - 0.02 * u} L${cx + 0.34 * u} ${top - 0.22 * u} Q${cx + 0.4 * u} ${top - 0.02 * u} ${cx + 0.34 * u} ${top + 0.16 * u} Z`} {...P} stroke={LINE} strokeWidth={0.3} />
        <rect x={cx - 0.07 * u} y={top - 0.1 * u} width={0.14 * u} height={0.16 * u} rx={0.05 * u} fill="#fff" fillOpacity={0.9} stroke={LINE} strokeWidth={0.3} />
      </g>
    ),
  },
  "wear:fiesta": {
    layer: "front",
    render: ({ cx, top, u }) => (
      <g>
        <polygon points={`${cx - 0.2 * u},${top + 0.05 * u} ${cx + 0.2 * u},${top + 0.05 * u} ${cx + 0.02 * u},${top - 0.62 * u}`} {...P} stroke={LINE} strokeWidth={0.3} />
        <path d={`M${cx - 0.13 * u} ${top - 0.14 * u} L${cx + 0.1 * u} ${top - 0.2 * u}`} stroke="#fff" strokeWidth={0.05 * u} strokeLinecap="round" opacity={0.85} />
        <path d={`M${cx - 0.07 * u} ${top - 0.34 * u} L${cx + 0.06 * u} ${top - 0.38 * u}`} stroke="#fff" strokeWidth={0.05 * u} strokeLinecap="round" opacity={0.85} />
        <circle cx={cx + 0.02 * u} cy={top - 0.62 * u} r={0.07 * u} fill={GOLD} stroke={GOLD_D} strokeWidth={0.2} />
      </g>
    ),
  },
  "wear:boina": {
    layer: "front",
    render: ({ cx, top, u }) => (
      <g>
        <rect x={cx - 0.02 * u} y={top - 0.2 * u} width={0.05 * u} height={0.08 * u} rx={0.02 * u} {...P} />
        <ellipse cx={cx + 0.02 * u} cy={top - 0.02 * u} rx={0.4 * u} ry={0.14 * u} {...P} stroke={LINE} strokeWidth={0.3} />
        <ellipse cx={cx + 0.02 * u} cy={top + 0.04 * u} rx={0.36 * u} ry={0.05 * u} fill="rgba(0,0,0,.12)" />
      </g>
    ),
  },
  "wear:chef": {
    layer: "front",
    render: ({ cx, top, u }) => (
      <g stroke="#cfcfcf" strokeWidth={0.3} fill="#fff">
        <circle cx={cx - 0.22 * u} cy={top - 0.2 * u} r={0.18 * u} />
        <circle cx={cx + 0.22 * u} cy={top - 0.2 * u} r={0.18 * u} />
        <circle cx={cx} cy={top - 0.3 * u} r={0.22 * u} />
        <rect x={cx - 0.34 * u} y={top - 0.12 * u} width={0.68 * u} height={0.16 * u} rx={0.04 * u} />
      </g>
    ),
  },
  "wear:flores": {
    layer: "front",
    render: ({ cx, top, u }) => {
      const cols = ["#ff9ab8", "#fff", "#ffd75e", "#c9b6ff", "#ff9ab8", "#fff", "#ffd75e"];
      return (
        <g>
          <path d={`M${cx - 0.4 * u} ${top + 0.06 * u} Q${cx} ${top - 0.1 * u} ${cx + 0.4 * u} ${top + 0.06 * u}`} stroke="#4caf7a" strokeWidth={0.04 * u} fill="none" />
          {cols.map((c, i) => {
            const t = i / 6;
            const x = cx - 0.4 * u + 0.8 * u * t;
            const y = top + 0.06 * u - Math.sin(Math.PI * t) * 0.1 * u * 1.2;
            return <Flower key={i} x={x} y={y} r={0.045 * u} c={c} />;
          })}
        </g>
      );
    },
  },
  "wear:corona": {
    layer: "front",
    render: ({ cx, top, u }) => {
      const y0 = top + 0.04 * u;
      return (
        <g>
          <polygon points={`${cx - 0.3 * u},${y0} ${cx - 0.3 * u},${y0 - 0.3 * u} ${cx - 0.15 * u},${y0 - 0.15 * u} ${cx},${y0 - 0.34 * u} ${cx + 0.15 * u},${y0 - 0.15 * u} ${cx + 0.3 * u},${y0 - 0.3 * u} ${cx + 0.3 * u},${y0}`} fill={GOLD} stroke={GOLD_D} strokeWidth={0.4} />
          <circle cx={cx} cy={y0 - 0.1 * u} r={0.045 * u} {...P} />
          <circle cx={cx - 0.18 * u} cy={y0 - 0.08 * u} r={0.03 * u} fill="#7fd1ff" />
          <circle cx={cx + 0.18 * u} cy={y0 - 0.08 * u} r={0.03 * u} fill="#7fd1ff" />
        </g>
      );
    },
  },

  // ---------- Cara ----------
  "wear:rubor": {
    layer: "front",
    render: ({ cx, ey, u }) => (
      <g fill="#ff7ba6" opacity={0.55}>
        <circle cx={cx - 0.27 * u} cy={ey + 0.17 * u} r={0.065 * u} />
        <circle cx={cx + 0.27 * u} cy={ey + 0.17 * u} r={0.065 * u} />
      </g>
    ),
  },
  "wear:pecas": {
    layer: "front",
    render: ({ cx, ey, u }) => (
      <g fill="#8a5a3c" opacity={0.75}>
        {[-1, 1].flatMap((s) => [[0.12, 0.17], [0.2, 0.15], [0.16, 0.22]].map(([dx, dy], i) => <circle key={`${s}${i}`} cx={cx + s * dx * u} cy={ey + dy * u} r={0.014 * u} />))}
      </g>
    ),
  },
  "wear:lentes": {
    layer: "front",
    render: ({ cx, ey, u }) => (
      <g fill="rgba(255,255,255,.14)" stroke="#3a2a2f" strokeWidth={0.03 * u}>
        <circle cx={cx - 0.17 * u} cy={ey} r={0.15 * u} />
        <circle cx={cx + 0.17 * u} cy={ey} r={0.15 * u} />
        <path d={`M${cx - 0.03 * u} ${ey} Q${cx} ${ey - 0.04 * u} ${cx + 0.03 * u} ${ey}`} fill="none" />
        <path d={`M${cx - 0.32 * u} ${ey - 0.02 * u} L${cx - 0.4 * u} ${ey - 0.05 * u}`} fill="none" />
        <path d={`M${cx + 0.32 * u} ${ey - 0.02 * u} L${cx + 0.4 * u} ${ey - 0.05 * u}`} fill="none" />
      </g>
    ),
  },
  "wear:sol": {
    layer: "front",
    render: ({ cx, ey, u }) => (
      <g>
        <rect x={cx - 0.33 * u} y={ey - 0.1 * u} width={0.31 * u} height={0.21 * u} rx={0.07 * u} fill="#241c22" fillOpacity={0.92} />
        <rect x={cx + 0.02 * u} y={ey - 0.1 * u} width={0.31 * u} height={0.21 * u} rx={0.07 * u} fill="#241c22" fillOpacity={0.92} />
        <rect x={cx - 0.03 * u} y={ey - 0.07 * u} width={0.06 * u} height={0.03 * u} fill="#241c22" />
        <path d={`M${cx - 0.28 * u} ${ey - 0.05 * u} L${cx - 0.2 * u} ${ey - 0.05 * u}`} stroke="#fff" strokeWidth={0.02 * u} opacity={0.7} strokeLinecap="round" />
        <path d={`M${cx + 0.07 * u} ${ey - 0.05 * u} L${cx + 0.15 * u} ${ey - 0.05 * u}`} stroke="#fff" strokeWidth={0.02 * u} opacity={0.7} strokeLinecap="round" />
      </g>
    ),
  },

  // ---------- Cuello ----------
  "wear:corbatin": {
    layer: "front",
    render: ({ tx, tt, h, u }) => {
      const y = tt + 0.05 * h;
      return (
        <g>
          <polygon points={`${tx},${y} ${tx - 0.22 * u},${y - 0.11 * u} ${tx - 0.22 * u},${y + 0.11 * u}`} {...P} stroke={LINE} strokeWidth={0.3} />
          <polygon points={`${tx},${y} ${tx + 0.22 * u},${y - 0.11 * u} ${tx + 0.22 * u},${y + 0.11 * u}`} {...P} stroke={LINE} strokeWidth={0.3} />
          <circle cx={tx} cy={y} r={0.055 * u} fill="#fff" stroke={LINE} strokeWidth={0.3} />
        </g>
      );
    },
  },
  "wear:bufanda": {
    layer: "front",
    render: ({ tx, tt, tw, h, u }) => {
      const y = tt - 0.02 * h;
      return (
        <g>
          <rect x={tx - tw * 0.48} y={y} width={tw * 0.96} height={0.15 * u} rx={0.07 * u} {...P} stroke={LINE} strokeWidth={0.3} />
          <rect x={tx + tw * 0.18} y={y + 0.08 * u} width={0.13 * u} height={0.38 * u} rx={0.04 * u} {...P} stroke={LINE} strokeWidth={0.3} />
          {[0.12, 0.24, 0.36].map((d) => <path key={d} d={`M${tx + tw * 0.18} ${y + 0.08 * u + d * u} h${0.13 * u}`} stroke="#fff" strokeWidth={0.025 * u} opacity={0.7} />)}
          {[-0.3, -0.1, 0.1].map((d) => <path key={d} d={`M${tx + d * tw} ${y} v${0.15 * u}`} stroke="#fff" strokeWidth={0.025 * u} opacity={0.5} />)}
        </g>
      );
    },
  },
  "wear:perlas": {
    layer: "front",
    render: ({ tx, tt, tw, h, u }) => (
      <g fill="#fff" stroke="#c9c2d4" strokeWidth={0.25}>
        {Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          return <circle key={i} cx={tx - 0.36 * tw + t * 0.72 * tw} cy={tt + 0.03 * h + Math.sin(Math.PI * t) * 0.1 * u} r={0.036 * u} />;
        })}
      </g>
    ),
  },

  // ---------- Cuerpo ----------
  "wear:rayas": {
    layer: "front",
    render: ({ tx, tt, tw, h }) => (
      <g>
        <clipPath id="clip-rayas"><rect x={tx - tw / 2} y={tt} width={tw} height={h} rx={tw * 0.12} /></clipPath>
        <g clipPath="url(#clip-rayas)" {...P} opacity={0.55}>
          {Array.from({ length: Math.ceil(h / (h * 0.13)) }, (_, i) => (i % 2 === 0 ? <rect key={i} x={tx - tw / 2} y={tt + i * h * 0.13} width={tw} height={h * 0.13} /> : null))}
        </g>
      </g>
    ),
  },
  "wear:delantal": {
    layer: "front",
    render: ({ tx, tt, tb, tw, h }) => {
      const y1 = tt + 0.1 * h;
      return (
        <g>
          <path d={`M${tx - 0.15 * tw} ${tt - 0.02 * h} L${tx - 0.24 * tw} ${y1} M${tx + 0.15 * tw} ${tt - 0.02 * h} L${tx + 0.24 * tw} ${y1}`} {...PS} strokeWidth={0.8} fill="none" />
          <polygon points={`${tx - 0.24 * tw},${y1} ${tx + 0.24 * tw},${y1} ${tx + 0.36 * tw},${tb} ${tx - 0.36 * tw},${tb}`} fill="#fff" fillOpacity={0.96} stroke="var(--primary)" strokeWidth={0.6} />
          <rect x={tx - 0.14 * tw} y={tt + 0.55 * h} width={0.28 * tw} height={0.2 * h} rx={1} fill="none" stroke="var(--primary)" strokeWidth={0.5} />
        </g>
      );
    },
  },
  "wear:tutu": {
    layer: "front",
    render: ({ tx, tb, tw, h }) => {
      const y = tb - 0.22 * h;
      return (
        <g fill="var(--primary)" stroke={LINE} strokeWidth={0.25}>
          <ellipse cx={tx} cy={y + 0.1 * h} rx={tw * 0.78} ry={0.09 * h} opacity={0.75} />
          <ellipse cx={tx} cy={y + 0.05 * h} rx={tw * 0.7} ry={0.09 * h} opacity={0.85} />
          <ellipse cx={tx} cy={y} rx={tw * 0.62} ry={0.09 * h} opacity={0.95} />
          <rect x={tx - tw * 0.4} y={y - 0.06 * h} width={tw * 0.8} height={0.07 * h} rx={1} stroke="none" opacity={1} />
        </g>
      );
    },
  },
  "wear:capa": {
    layer: "back",
    render: ({ tx, tt, tb, tw, h }) => (
      <g>
        <path d={`M${tx - 0.34 * tw} ${tt} L${tx + 0.34 * tw} ${tt} L${tx + 0.7 * tw} ${tb + 0.1 * h} L${tx - 0.7 * tw} ${tb + 0.1 * h} Z`} {...P} stroke={LINE} strokeWidth={0.4} />
        <path d={`M${tx - 0.45 * tw} ${tt + 0.5 * h} L${tx - 0.7 * tw} ${tb + 0.1 * h} M${tx + 0.45 * tw} ${tt + 0.5 * h} L${tx + 0.7 * tw} ${tb + 0.1 * h}`} stroke="rgba(0,0,0,.2)" strokeWidth={0.4} />
      </g>
    ),
  },
  "wear:vestido": {
    layer: "front",
    render: ({ tx, tt, tb, tw, h }) => {
      const y1 = tt + 0.08 * h;
      const hem = tb + 0.06 * h;
      return (
        <g>
          <path d={`M${tx - 0.3 * tw} ${y1} L${tx + 0.3 * tw} ${y1} L${tx + 0.52 * tw} ${hem} L${tx - 0.52 * tw} ${hem} Z`} {...P} stroke={LINE} strokeWidth={0.4} />
          <rect x={tx - 0.34 * tw} y={tt + 0.42 * h} width={0.68 * tw} height={0.07 * h} rx={0.6} fill="#fff" fillOpacity={0.85} />
          {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={tx - 0.43 * tw + i * 0.172 * tw} cy={hem} r={0.09 * tw} {...P} stroke={LINE} strokeWidth={0.3} />)}
          <circle cx={tx} cy={tt + 0.455 * h} r={0.06 * tw} fill={GOLD} stroke={GOLD_D} strokeWidth={0.3} />
        </g>
      );
    },
  },

  // ---------- Fondo ----------
  "wear:cielo": {
    layer: "back",
    render: ({ W, H }) => (
      <g>
        <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.62} ry={H * 0.56} {...P} opacity={0.2} />
        <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.46} ry={H * 0.42} fill="#fff" opacity={0.35} />
      </g>
    ),
  },
  "wear:estrellas": {
    layer: "back",
    render: ({ W, H }) => (
      <g>
        <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.62} ry={H * 0.56} fill="#6e63c9" opacity={0.18} />
        {[[8, 0.12, 6], [88, 0.2, 5], [14, 0.5, 4], [92, 0.55, 6], [6, 0.82, 5], [86, 0.86, 4], [50, 0.02, 4], [30, 0.04, 3], [72, 0.06, 3.5]].map(([x, y, r], i) => (
          <polygon key={i} points={star(x, H * y, r)} fill={GOLD} stroke={GOLD_D} strokeWidth={0.3} />
        ))}
      </g>
    ),
  },
  "wear:corazones": {
    layer: "back",
    render: ({ W, H }) => (
      <g>
        <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.62} ry={H * 0.56} {...P} opacity={0.16} />
        {[[8, 0.16, 7], [90, 0.1, 6], [10, 0.55, 5], [92, 0.5, 7], [6, 0.86, 6], [88, 0.84, 5], [50, 0.03, 4]].map(([x, y, s], i) => (
          <path key={i} d={heart(x, H * y, s)} {...P} opacity={0.75} />
        ))}
      </g>
    ),
  },
  "wear:arcoiris": {
    layer: "back",
    render: ({ W, H, cx, top, u }) => {
      const colors = ["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#74c0fc", "#b197fc"];
      const cy = top + 0.5 * u;
      return (
        <g fill="none" strokeWidth={0.05 * u} strokeLinecap="round" opacity={0.9}>
          {colors.map((c, i) => {
            const r = u * (1.05 - i * 0.07);
            return <path key={c} d={`M${Math.max(0, cx - r)} ${cy} A${r} ${r} 0 0 1 ${Math.min(W, cx + r)} ${cy}`} stroke={c} />;
          })}
        </g>
      );
    },
  },
};

// ---------- Ropa de evento ----------
ART["wear:santa"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g>
      <polygon points={`${cx - 0.32 * u},${top + 0.04 * u} ${cx + 0.32 * u},${top + 0.04 * u} ${cx + 0.1 * u},${top - 0.5 * u}`} fill="#e53935" stroke={LINE} strokeWidth={0.3} />
      <rect x={cx - 0.36 * u} y={top - 0.04 * u} width={0.72 * u} height={0.12 * u} rx={0.06 * u} fill="#fff" stroke="#d9d9d9" strokeWidth={0.3} />
      <circle cx={cx + 0.1 * u} cy={top - 0.5 * u} r={0.07 * u} fill="#fff" stroke="#d9d9d9" strokeWidth={0.3} />
    </g>
  ),
};
ART["wear:bruja"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g>
      <polygon points={`${cx - 0.22 * u},${top} ${cx + 0.22 * u},${top} ${cx + 0.05 * u},${top - 0.62 * u}`} fill="#2d2438" stroke={LINE} strokeWidth={0.3} />
      <ellipse cx={cx} cy={top + 0.01 * u} rx={0.44 * u} ry={0.07 * u} fill="#2d2438" stroke={LINE} strokeWidth={0.3} />
      <rect x={cx - 0.21 * u} y={top - 0.1 * u} width={0.42 * u} height={0.08 * u} fill="#8a5bd6" />
      <rect x={cx - 0.05 * u} y={top - 0.11 * u} width={0.1 * u} height={0.1 * u} rx={0.015 * u} fill={GOLD} stroke={GOLD_D} strokeWidth={0.2} />
    </g>
  ),
};
ART["wear:diadema"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g>
      <path d={`M${cx - 0.3 * u} ${top + 0.08 * u} Q${cx} ${top - 0.14 * u} ${cx + 0.3 * u} ${top + 0.08 * u}`} {...PS} strokeWidth={0.035 * u} fill="none" />
      <path d={heart(cx - 0.15 * u, top - 0.05 * u, 0.1 * u)} {...P} stroke={LINE} strokeWidth={0.25} />
      <path d={heart(cx + 0.15 * u, top - 0.05 * u, 0.1 * u)} {...P} stroke={LINE} strokeWidth={0.25} />
    </g>
  ),
};
ART["wear:flor"] = {
  layer: "front",
  render: ({ cx, top, u }) => <Flower x={cx + 0.27 * u} y={top + 0.03 * u} r={0.085 * u} c="#ff9ab8" />,
};
ART["wear:banda"] = {
  layer: "front",
  render: ({ tx, tt, tb, tw }) => (
    <g>
      <polygon points={`${tx - 0.32 * tw},${tt} ${tx - 0.1 * tw},${tt} ${tx + 0.36 * tw},${tb} ${tx + 0.14 * tw},${tb}`} fill="#6bbcf2" stroke={LINE} strokeWidth={0.3} />
      <path d={`M${tx - 0.21 * tw} ${tt} L${tx + 0.25 * tw} ${tb}`} stroke="#fff" strokeWidth={0.08 * tw} />
    </g>
  ),
};


// ---------- Más prendas (Manos, Pies y más) ----------

const BROWN = "#b07a4f";
const NAVY = "#2b2b3a";

ART["wear:gorra"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g>
      <path d={`M${cx - 0.32 * u} ${top + 0.08 * u} Q${cx - 0.3 * u} ${top - 0.22 * u} ${cx + 0.02 * u} ${top - 0.22 * u} Q${cx + 0.32 * u} ${top - 0.2 * u} ${cx + 0.34 * u} ${top + 0.08 * u} Z`} {...P} stroke={LINE} strokeWidth={0.3} />
      <path d={`M${cx + 0.1 * u} ${top + 0.08 * u} Q${cx + 0.5 * u} ${top + 0.02 * u} ${cx + 0.6 * u} ${top + 0.12 * u} Q${cx + 0.3 * u} ${top + 0.14 * u} ${cx + 0.1 * u} ${top + 0.12 * u} Z`} fill="rgba(0,0,0,.25)" stroke={LINE} strokeWidth={0.3} />
      <circle cx={cx + 0.02 * u} cy={top - 0.22 * u} r={0.035 * u} fill="#fff" />
    </g>
  ),
};
ART["wear:copa"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <ellipse cx={cx} cy={top + 0.04 * u} rx={0.42 * u} ry={0.08 * u} fill={NAVY} />
      <rect x={cx - 0.24 * u} y={top - 0.42 * u} width={0.48 * u} height={0.46 * u} rx={0.03 * u} fill={NAVY} />
      <rect x={cx - 0.24 * u} y={top - 0.1 * u} width={0.48 * u} height={0.09 * u} {...P} />
    </g>
  ),
};
ART["wear:orejas"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <polygon points={`${cx - 0.34 * u},${top + 0.1 * u} ${cx - 0.3 * u},${top - 0.26 * u} ${cx - 0.06 * u},${top + 0.02 * u}`} {...P} />
      <polygon points={`${cx + 0.34 * u},${top + 0.1 * u} ${cx + 0.3 * u},${top - 0.26 * u} ${cx + 0.06 * u},${top + 0.02 * u}`} {...P} />
      <polygon points={`${cx - 0.28 * u},${top + 0.02 * u} ${cx - 0.27 * u},${top - 0.15 * u} ${cx - 0.14 * u},${top}`} fill="#ffd0de" stroke="none" />
      <polygon points={`${cx + 0.28 * u},${top + 0.02 * u} ${cx + 0.27 * u},${top - 0.15 * u} ${cx + 0.14 * u},${top}`} fill="#ffd0de" stroke="none" />
    </g>
  ),
};
ART["wear:antenas"] = {
  layer: "front",
  render: ({ cx, top, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <path d={`M${cx - 0.14 * u} ${top + 0.03 * u} Q${cx - 0.22 * u} ${top - 0.2 * u} ${cx - 0.3 * u} ${top - 0.34 * u}`} stroke={NAVY} strokeWidth={0.03 * u} fill="none" />
      <path d={`M${cx + 0.14 * u} ${top + 0.03 * u} Q${cx + 0.22 * u} ${top - 0.2 * u} ${cx + 0.3 * u} ${top - 0.34 * u}`} stroke={NAVY} strokeWidth={0.03 * u} fill="none" />
      <circle cx={cx - 0.3 * u} cy={top - 0.36 * u} r={0.06 * u} {...P} />
      <circle cx={cx + 0.3 * u} cy={top - 0.36 * u} r={0.06 * u} {...P} />
    </g>
  ),
};
ART["wear:bigote"] = {
  layer: "front",
  render: ({ cx, ey, u }) => (
    <path d={`M${cx} ${ey + 0.3 * u} Q${cx - 0.1 * u} ${ey + 0.22 * u} ${cx - 0.26 * u} ${ey + 0.3 * u} Q${cx - 0.2 * u} ${ey + 0.4 * u} ${cx} ${ey + 0.34 * u} Q${cx + 0.2 * u} ${ey + 0.4 * u} ${cx + 0.26 * u} ${ey + 0.3 * u} Q${cx + 0.1 * u} ${ey + 0.22 * u} ${cx} ${ey + 0.3 * u} Z`} fill={NAVY} stroke={LINE} strokeWidth={0.2} />
  ),
};
ART["wear:antifaz"] = {
  layer: "front",
  render: ({ cx, ey, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <path d={`M${cx - 0.34 * u} ${ey - 0.04 * u} Q${cx} ${ey - 0.16 * u} ${cx + 0.34 * u} ${ey - 0.04 * u} L${cx + 0.3 * u} ${ey + 0.1 * u} Q${cx} ${ey + 0.02 * u} ${cx - 0.3 * u} ${ey + 0.1 * u} Z`} {...P} />
      <ellipse cx={cx - 0.13 * u} cy={ey + 0.02 * u} rx={0.07 * u} ry={0.045 * u} fill="rgba(255,255,255,.85)" stroke="none" />
      <ellipse cx={cx + 0.13 * u} cy={ey + 0.02 * u} rx={0.07 * u} ry={0.045 * u} fill="rgba(255,255,255,.85)" stroke="none" />
    </g>
  ),
};
ART["wear:nariz"] = {
  layer: "front",
  render: ({ cx, ey, u }) => <circle cx={cx} cy={ey + 0.2 * u} r={0.07 * u} fill="#e0433f" stroke={LINE} strokeWidth={0.25} />,
};
ART["wear:lazocuello"] = {
  layer: "front",
  render: ({ tx, tt, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <polygon points={`${tx},${tt + 0.02 * u} ${tx - 0.2 * u},${tt - 0.07 * u} ${tx - 0.2 * u},${tt + 0.11 * u}`} {...P} />
      <polygon points={`${tx},${tt + 0.02 * u} ${tx + 0.2 * u},${tt - 0.07 * u} ${tx + 0.2 * u},${tt + 0.11 * u}`} {...P} />
      <circle cx={tx} cy={tt + 0.02 * u} r={0.05 * u} fill="#fff" />
    </g>
  ),
};
ART["wear:collar"] = {
  layer: "front",
  render: ({ tx, tt, tw, h, u }) => (
    <g>
      <path d={`M${tx - 0.36 * tw} ${tt + 0.02 * h} Q${tx} ${tt + 0.26 * h} ${tx + 0.36 * tw} ${tt + 0.02 * h}`} stroke={GOLD} strokeWidth={0.035 * u} fill="none" />
      <circle cx={tx} cy={tt + 0.15 * h} r={0.06 * u} fill={GOLD} stroke={GOLD_D} strokeWidth={0.25} />
      <circle cx={tx} cy={tt + 0.15 * h} r={0.025 * u} {...P} />
    </g>
  ),
};
ART["wear:pijama"] = {
  layer: "front",
  render: ({ tx, tt, tw, h }) => (
    <g>
      <clipPath id="clip-pijama"><rect x={tx - tw / 2} y={tt} width={tw} height={h} rx={tw * 0.14} /></clipPath>
      <g clipPath="url(#clip-pijama)">
        <rect x={tx - tw / 2} y={tt} width={tw} height={h} {...P} opacity={0.6} />
        {[0.22, 0.5, 0.78].map((a, i) => <polygon key={i} points={star(tx - tw / 2 + a * tw, tt + (0.3 + (i % 2) * 0.3) * h, tw * 0.07)} fill="#fff" opacity={0.9} />)}
      </g>
    </g>
  ),
};
ART["wear:uniforme"] = {
  layer: "front",
  render: ({ tx, tt, tw, h }) => (
    <g stroke="#cfcfcf" strokeWidth={0.3}>
      <rect x={tx - tw / 2} y={tt} width={tw} height={h} rx={tw * 0.14} fill="#fff" />
      <line x1={tx} y1={tt} x2={tx} y2={tt + h} />
      {[0.25, 0.5, 0.75].map((a) => <g key={a}><circle cx={tx - tw * 0.1} cy={tt + a * h} r={tw * 0.04} {...P} stroke="none" /><circle cx={tx + tw * 0.1} cy={tt + a * h} r={tw * 0.04} {...P} stroke="none" /></g>)}
    </g>
  ),
};
ART["wear:sueter"] = {
  layer: "front",
  render: ({ tx, tt, tw, h }) => (
    <g>
      <clipPath id="clip-sueter"><rect x={tx - tw / 2} y={tt} width={tw} height={h} rx={tw * 0.14} /></clipPath>
      <g clipPath="url(#clip-sueter)">
        <rect x={tx - tw / 2} y={tt} width={tw} height={h} {...P} opacity={0.75} />
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={tx - tw / 2} y1={tt + h * 0.14 * (i + 1)} x2={tx + tw / 2} y2={tt + h * 0.14 * (i + 1)} stroke="rgba(255,255,255,.35)" strokeWidth={h * 0.025} />)}
        <rect x={tx - tw / 2} y={tt + h * 0.88} width={tw} height={h * 0.12} fill="rgba(0,0,0,.18)" />
      </g>
    </g>
  ),
};
ART["wear:cucharon"] = {
  layer: "front",
  render: ({ hr, hy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <rect x={hr - 0.025 * u} y={hy - 0.62 * u} width={0.05 * u} height={0.66 * u} rx={0.025 * u} fill={BROWN} />
      <ellipse cx={hr} cy={hy - 0.7 * u} rx={0.1 * u} ry={0.13 * u} fill={BROWN} />
    </g>
  ),
};
ART["wear:varita"] = {
  layer: "front",
  render: ({ hr, hy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <rect x={hr - 0.02 * u} y={hy - 0.6 * u} width={0.04 * u} height={0.64 * u} rx={0.02 * u} fill={NAVY} />
      <polygon points={star(hr, hy - 0.66 * u, 0.13 * u)} fill={GOLD} stroke={GOLD_D} />
      <circle cx={hr + 0.14 * u} cy={hy - 0.52 * u} r={0.02 * u} {...P} stroke="none" />
    </g>
  ),
};
ART["wear:globo"] = {
  layer: "front",
  render: ({ hr, hy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <path d={`M${hr} ${hy} Q${hr + 0.05 * u} ${hy - 0.3 * u} ${hr} ${hy - 0.5 * u}`} stroke="rgba(0,0,0,.4)" fill="none" />
      <ellipse cx={hr} cy={hy - 0.72 * u} rx={0.18 * u} ry={0.22 * u} {...P} />
      <ellipse cx={hr - 0.06 * u} cy={hy - 0.8 * u} rx={0.04 * u} ry={0.07 * u} fill="rgba(255,255,255,.55)" stroke="none" />
    </g>
  ),
};
ART["wear:piruleta"] = {
  layer: "front",
  render: ({ hr, hy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      <rect x={hr - 0.015 * u} y={hy - 0.5 * u} width={0.03 * u} height={0.54 * u} fill="#fff" />
      <circle cx={hr} cy={hy - 0.58 * u} r={0.16 * u} {...P} />
      <path d={`M${hr} ${hy - 0.58 * u} m-${0.1 * u} 0 a${0.1 * u} ${0.1 * u} 0 1 1 ${0.1 * u} ${0.1 * u}`} stroke="#fff" strokeWidth={0.03 * u} fill="none" />
    </g>
  ),
};
ART["wear:zapatos"] = {
  layer: "front",
  render: ({ fl, fr, fy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      {[fl, fr].map((x, i) => <g key={i}><ellipse cx={x + (i ? 0.06 : -0.06) * u} cy={fy} rx={0.17 * u} ry={0.075 * u} {...P} /><rect x={x - 0.04 * u} y={fy - 0.03 * u} width={0.08 * u} height={0.02 * u} fill="#fff" stroke="none" /></g>)}
    </g>
  ),
};
ART["wear:botas"] = {
  layer: "front",
  render: ({ fl, fr, fy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      {[fl, fr].map((x, i) => <g key={i}><rect x={x - 0.1 * u} y={fy - 0.26 * u} width={0.2 * u} height={0.26 * u} rx={0.04 * u} {...P} /><ellipse cx={x + (i ? 0.05 : -0.05) * u} cy={fy + 0.01 * u} rx={0.16 * u} ry={0.07 * u} {...P} /><rect x={x - 0.1 * u} y={fy - 0.26 * u} width={0.2 * u} height={0.05 * u} fill="rgba(255,255,255,.5)" stroke="none" /></g>)}
    </g>
  ),
};
ART["wear:pantuflas"] = {
  layer: "front",
  render: ({ fl, fr, fy, u }) => (
    <g stroke={LINE} strokeWidth={0.3}>
      {[fl, fr].map((x, i) => <g key={i}><ellipse cx={x + (i ? 0.05 : -0.05) * u} cy={fy} rx={0.17 * u} ry={0.09 * u} fill="#ffd0de" /><ellipse cx={x + (i ? 0.1 : -0.1) * u} cy={fy - 0.02 * u} rx={0.09 * u} ry={0.06 * u} {...P} /></g>)}
    </g>
  ),
};
ART["wear:noche"] = {
  layer: "back",
  render: ({ W, H }) => (
    <g>
      <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.62} ry={H * 0.56} fill="#2b2f5a" opacity={0.7} />
      {[[0.25, 0.2], [0.7, 0.15], [0.82, 0.4], [0.15, 0.5], [0.6, 0.08], [0.35, 0.32]].map(([a, b], i) => <polygon key={i} points={star(a * W, b * H, W * 0.035)} fill={GOLD} opacity={0.95} />)}
      <circle cx={W * 0.8} cy={H * 0.18} r={W * 0.07} fill="#fff7d6" opacity={0.95} />
    </g>
  ),
};
ART["wear:atardecer"] = {
  layer: "back",
  render: ({ W, H }) => (
    <g>
      <ellipse cx={W / 2} cy={H * 0.52} rx={W * 0.62} ry={H * 0.56} fill="#ff9a6c" opacity={0.45} />
      <ellipse cx={W / 2} cy={H * 0.62} rx={W * 0.46} ry={H * 0.4} fill="#ffd27a" opacity={0.55} />
      <circle cx={W / 2} cy={H * 0.74} r={W * 0.16} fill="#ff7a4d" opacity={0.7} />
    </g>
  ),
};
