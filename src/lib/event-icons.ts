import { Cake, Coffee, Flag, Flower2, Ghost, Glasses, Heart, PartyPopper, Sparkles, TreePine, Trophy, Wind, type LucideIcon } from "lucide-react";

export const EVENT_ICONS: Record<string, LucideIcon> = {
  heart: Heart, flower: Flower2, trophy: Trophy, flag: Flag, ghost: Ghost, kite: Wind, tree: TreePine,
  party: PartyPopper, coffee: Coffee, cake: Cake, glasses: Glasses,
};
export const eventIcon = (name: string): LucideIcon => EVENT_ICONS[name] ?? Sparkles;
