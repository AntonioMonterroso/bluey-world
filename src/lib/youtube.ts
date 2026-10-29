// Solo se aceptan enlaces de YouTube con un ID válido: nunca se incrusta una URL arbitraria.
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);
const ID = /^[\w-]{11}$/;

function toSeconds(t: string | null) {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function parseYouTube(input: string): { id: string; start: number } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol) || !HOSTS.has(url.hostname)) return null;

  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else {
    const [, kind, rest] = url.pathname.split("/");
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(kind)) id = rest ?? null;
  }
  if (!id || !ID.test(id)) return null;
  return { id, start: toSeconds(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

export function embedSrc(id: string, start = 0) {
  const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (start > 0) q.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
}
