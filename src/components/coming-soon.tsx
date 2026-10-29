import Image from "next/image";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  text,
  art,
}: {
  title: string;
  text: string;
  art?: { src: string; w: number; h: number; alt: string };
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl">{title}</h1>
      {art && (
        <Image
          src={art.src}
          alt={art.alt}
          width={art.w}
          height={art.h}
          className="h-auto w-full max-w-xl rounded-3xl"
        />
      )}
      <Card className="p-6">
        <p className="text-muted-foreground">{text}</p>
        <p className="mt-2 text-sm font-semibold">Esta sección se construye en las siguientes fases.</p>
      </Card>
    </div>
  );
}
