"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type MiniScore } from "@/lib/db/db";
import { upsertRow } from "@/lib/db/repo";
import { dayKey } from "@/lib/game/engine";
import { CHALLENGE_BONUS, CHALLENGE_MIN, DAILY_COIN_CAP, DAILY_XP_CAP, dailyChallenge, levelMult, rewardFor, type Level, type MiniGame, type MiniRecipe, type MiniReward } from "@/lib/game/minigames";
import { writeAwards } from "@/lib/game/use-game";
import { useGame } from "@/lib/game/use-game";
import { useRecipes } from "@/lib/recipes";

const NAMES: Record<MiniGame, string> = { pasos: "Ordena los pasos", memoria: "Memoria de ingredientes", adivina: "Adivina el postre", torta: "Decora la torta", horno: "Horno perfecto", atrapa: "Atrapa ingredientes", cambio: "Cuenta el cambio" };
export const gameName = (g: MiniGame) => NAMES[g];

/** Tus recetas en el formato simple que usan los minijuegos. */
export function useMiniRecipes(): MiniRecipe[] | undefined {
  const recipes = useRecipes();
  return useMemo(
    () => recipes?.map((r) => ({
      title: r.title,
      category: r.category,
      steps: r.steps.map((s) => s.text),
      ingredients: r.ingredients.map((i) => i.name).filter((n) => n.trim()),
      minutes: (r.prep_min ?? 0) + (r.cook_min ?? 0) || null,
    })),
    [recipes],
  );
}

/** Lo que ya ganó hoy con minijuegos y lo que le queda por ganar. */
export function useMiniToday() {
  const { events } = useGame();
  const prefix = `mini:${dayKey(Date.now())}:`;
  const today = events.filter((e) => e.id.startsWith(prefix));
  const coins = today.reduce((s, e) => s + e.coins, 0);
  const xp = today.reduce((s, e) => s + e.xp, 0);
  return { coins, xp, plays: today.length, coinsLeft: Math.max(0, DAILY_COIN_CAP - coins), xpLeft: Math.max(0, DAILY_XP_CAP - xp) };
}

export interface MiniResult extends MiniReward { record: boolean; challengeBonus: boolean }

export function useMiniScores() {
  return useLiveQuery(async () => Object.fromEntries((await db.mini_scores.toArray()).filter((r) => !r.deleted_at).map((r) => [r.id, r])) as Record<string, MiniScore>, []);
}

/** ¿Ya ganaste el bono del reto de hoy? */
export function useChallengeDone() {
  const { events } = useGame();
  return events.some((e) => e.id === `mini-reto:${dayKey(Date.now())}`);
}

/**
 * Guarda el premio de una partida (con tope diario y según la dificultad), actualiza tu récord y,
 * si era el reto del día y te fue bien, da un bono una sola vez.
 */
export async function awardMini(game: MiniGame, score: number, opts: { level?: Level; challenge?: boolean } = {}): Promise<MiniResult> {
  const now = Date.now();
  const level = opts.level ?? "normal";
  const day = dayKey(now);
  const prefix = `mini:${day}:`;
  const existing = await db.game_events.toArray();
  const today = existing.filter((e) => !e.deleted_at && e.id.startsWith(prefix));
  const reward = rewardFor(score, { xp: today.reduce((s, e) => s + e.xp, 0), coins: today.reduce((s, e) => s + e.coins, 0) }, levelMult(level));
  const awards = [{ id: `${prefix}${today.length + 1}:${game}`, kind: "mini", label: gameName(game), xp: reward.xp, coins: reward.coins, at: now }];
  const ch = dailyChallenge(day);
  const challengeBonus = !!opts.challenge && ch.game === game && ch.level === level && score >= CHALLENGE_MIN && !existing.some((e) => e.id === `mini-reto:${day}`);
  if (challengeBonus) awards.push({ id: `mini-reto:${day}`, kind: "mini", label: `Reto del día: ${gameName(game)}`, ...CHALLENGE_BONUS, at: now });
  // Aunque ya no pague (tope del día), la partida queda anotada: la Historia cuenta tus partidas.
  await writeAwards(awards, existing);

  const prev = await db.mini_scores.get(game);
  const record = !prev || score > prev.best;
  await upsertRow<MiniScore>("mini_scores", {
    id: game,
    best: record ? Math.round(score * 100) / 100 : prev!.best,
    best_level: record ? level : prev!.best_level,
    plays: (prev?.plays ?? 0) + 1,
    last_at: now,
  });
  return { ...reward, record: record && score > 0, challengeBonus };
}
