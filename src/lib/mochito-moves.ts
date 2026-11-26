/** Cómo se mueve en cada truco. */
export const TRICK_MOVES: Record<string, string[]> = {
  sentarse: ["translateY(0px) scaleY(1)", "translateY(6px) scaleY(0.9)", "translateY(6px) scaleY(0.9)", "translateY(0px) scaleY(1)"],
  pata: ["rotate(0deg)", "rotate(-10deg)", "rotate(-4deg)", "rotate(-10deg)", "rotate(0deg)"],
  girar: ["scaleX(1)", "scaleX(-1)", "scaleX(1)", "scaleX(-1)", "scaleX(1)"],
  saltar: ["translateY(0px)", "translateY(-44px)", "translateY(0px)", "translateY(-20px)", "translateY(0px)"],
  rodar: ["rotate(0deg)", "rotate(180deg)", "rotate(360deg)"],
  muerto: ["rotate(0deg)", "rotate(-80deg)", "rotate(-80deg)", "rotate(-80deg)", "rotate(0deg)"],
  bailar: ["translateY(0px) rotate(-8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(-8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(0deg)"],
};

