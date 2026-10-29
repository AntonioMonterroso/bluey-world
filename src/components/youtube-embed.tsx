"use client";

import { useSyncExternalStore } from "react";
import { CloudOff } from "lucide-react";
import { embedSrc, parseYouTube } from "@/lib/youtube";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Video de YouTube responsive; sin internet muestra un aviso en lugar del iframe roto. */
export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const video = parseYouTube(url);
  if (!video) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-3xl border bg-muted">
      {online ? (
        <iframe
          src={embedSrc(video.id, video.start)}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full border-0"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
          <CloudOff className="size-8" aria-hidden />
          <p className="text-sm font-semibold">Este video necesita internet. Vuelve a verlo cuando te conectes.</p>
        </div>
      )}
    </div>
  );
}
