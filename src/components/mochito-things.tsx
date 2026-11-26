"use client";

import { cn } from "@/lib/utils";

/** Dibujo de cada cosa de Mochito (cama, platito o juguete), en SVG para que pese poco y tome los colores del tema. */
export function ThingArt({ id, className }: { id: string; className?: string }) {
  const svg = (children: React.ReactNode, vb = "0 0 100 60") => (
    <svg viewBox={vb} className={cn("h-full w-full overflow-visible", className)} aria-hidden>{children}</svg>
  );
  switch (id) {
    case "pet:cama-nube":
      return svg(<>
        <ellipse cx="50" cy="44" rx="48" ry="14" fill="#cfe3f5" stroke="#8fb6d9" strokeWidth="2" />
        <circle cx="16" cy="36" r="12" fill="#e7f1fb" stroke="#8fb6d9" strokeWidth="2" />
        <circle cx="34" cy="30" r="14" fill="#e7f1fb" stroke="#8fb6d9" strokeWidth="2" />
        <circle cx="56" cy="29" r="15" fill="#e7f1fb" stroke="#8fb6d9" strokeWidth="2" />
        <circle cx="78" cy="31" r="13" fill="#e7f1fb" stroke="#8fb6d9" strokeWidth="2" />
        <ellipse cx="50" cy="44" rx="34" ry="8" fill="#f6fbff" />
      </>);
    case "pet:cama-corazon":
      return svg(<>
        <ellipse cx="50" cy="45" rx="47" ry="13" fill="var(--primary)" opacity="0.85" />
        <path d="M50 52 C 20 40, 8 22, 22 12 C 34 4, 46 12, 50 20 C 54 12, 66 4, 78 12 C 92 22, 80 40, 50 52 Z" fill="var(--primary)" stroke="rgb(0 0 0 / 0.15)" strokeWidth="2" />
        <ellipse cx="50" cy="40" rx="26" ry="8" fill="#fff" opacity="0.75" />
      </>);
    case "pet:cama-rey":
      return svg(<>
        <rect x="4" y="26" width="92" height="26" rx="10" fill="#7a2e3a" />
        <rect x="10" y="30" width="80" height="16" rx="8" fill="#f2d48a" />
        <path d="M30 22 L36 8 L44 18 L50 4 L56 18 L64 8 L70 22 Z" fill="#e0b54a" stroke="#a87f1f" strokeWidth="1.5" />
        <circle cx="50" cy="12" r="2.5" fill="#c0392b" />
        <ellipse cx="50" cy="38" rx="30" ry="5" fill="#fff6dc" />
      </>);
    case "pet:plato":
      return svg(<>
        <path d="M14 28 H86 L78 50 H22 Z" fill="var(--primary)" />
        <ellipse cx="50" cy="28" rx="36" ry="7" fill="#7b4a2a" />
        <circle cx="38" cy="26" r="4" fill="#a8693c" /><circle cx="50" cy="25" r="4" fill="#a8693c" /><circle cx="62" cy="27" r="4" fill="#a8693c" />
      </>);
    case "pet:plato-hueso":
      return svg(<>
        <path d="M12 28 H88 L80 50 H20 Z" fill="#f0e6d6" stroke="#b9a27f" strokeWidth="2" />
        <ellipse cx="50" cy="28" rx="38" ry="7" fill="#7b4a2a" />
        <g transform="translate(50 40)" fill="#b9a27f">
          <rect x="-12" y="-2.5" width="24" height="5" rx="2" />
          <circle cx="-13" cy="-3" r="3.5" /><circle cx="-13" cy="3" r="3.5" /><circle cx="13" cy="-3" r="3.5" /><circle cx="13" cy="3" r="3.5" />
        </g>
      </>);
    case "pet:pelota":
      return svg(<>
        <circle cx="30" cy="30" r="26" fill="#f4c430" stroke="#c99a10" strokeWidth="2" />
        <path d="M8 22 Q30 34 52 22" stroke="#fff" strokeWidth="3" fill="none" />
        <path d="M8 38 Q30 26 52 38" stroke="#fff" strokeWidth="3" fill="none" />
      </>, "0 0 60 60");
    case "pet:cuerda":
      return svg(<>
        <path d="M14 30 Q30 10 50 30 T86 30" stroke="#c8553d" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M14 30 Q30 10 50 30 T86 30" stroke="#f4e1c1" strokeWidth="3" strokeDasharray="5 6" fill="none" />
        <circle cx="10" cy="31" r="7" fill="#f4e1c1" /><circle cx="90" cy="31" r="7" fill="#f4e1c1" />
      </>);
    case "pet:hueso":
      return svg(<g fill="#f5efe4" stroke="#c9b89a" strokeWidth="2">
        <rect x="22" y="22" width="56" height="16" rx="6" />
        <circle cx="20" cy="20" r="11" /><circle cx="20" cy="40" r="11" /><circle cx="80" cy="20" r="11" /><circle cx="80" cy="40" r="11" />
        <rect x="24" y="23" width="52" height="14" rx="6" stroke="none" />
      </g>);
    case "pet:peluche":
      return svg(<>
        <circle cx="16" cy="12" r="8" fill="#b07a4f" /><circle cx="44" cy="12" r="8" fill="#b07a4f" />
        <circle cx="30" cy="24" r="17" fill="#c68b5a" />
        <ellipse cx="30" cy="48" rx="16" ry="12" fill="#c68b5a" />
        <ellipse cx="30" cy="29" rx="7" ry="5" fill="#f0d2b0" />
        <circle cx="24" cy="21" r="2" fill="#3a2a1f" /><circle cx="36" cy="21" r="2" fill="#3a2a1f" /><circle cx="30" cy="27" r="2" fill="#3a2a1f" />
      </>, "0 0 60 60");
    default:
      return null;
  }
}

/** Mochito en su casita: la cama detrás, el platito a un lado y su juguete al frente. `children` es Mochito. */
export function MochitoHome({ home, children, className }: { home?: { bed?: string; bowl?: string; toy?: string }; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative inline-flex h-full items-end", className)}>
      {home?.bed && <div className="pointer-events-none absolute bottom-[-8%] left-1/2 h-[40%] w-[175%] -translate-x-1/2"><ThingArt id={home.bed} /></div>}
      <div className="relative h-full">{children}</div>
      {home?.bowl && <div className="pointer-events-none absolute bottom-0 left-[-62%] h-[26%] w-[58%]"><ThingArt id={home.bowl} /></div>}
      {home?.toy && <div className="pointer-events-none absolute bottom-[-2%] right-[-42%] h-[24%] w-[42%]"><ThingArt id={home.toy} /></div>}
    </div>
  );
}
