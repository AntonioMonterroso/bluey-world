export const THEMES = [
  { id: "rosas", name: "Rosas", swatch: ["#f7c6d9", "#e8789f", "#fff0f5"] },
  { id: "lilas", name: "Lilas", swatch: ["#d9c6f7", "#9b78e8", "#f6f0ff"] },
  { id: "celestes", name: "Celestes", swatch: ["#bfe6f5", "#5cc7c9", "#effafd"] },
  { id: "verdes", name: "Verdes", swatch: ["#cdeccb", "#7fc488", "#f2fbf0"] },
  { id: "cafes", name: "Cafés", swatch: ["#e8d2b8", "#b9855a", "#fbf5ec"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "rosas";
export const THEME_STORAGE_KEY = "bw-theme";
