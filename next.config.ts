import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para publicar en un hosting estático (Cloudflare Pages, Netlify): NEXT_OUTPUT=export npm run build → carpeta out/
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export" as const } : {}),
  // GitHub Pages sirve la app dentro de una carpeta (antoniomonterroso.github.io/bluey-world).
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),
  images: { unoptimized: true }, // imágenes ya optimizadas; así se cachean fácil offline
  // La publicación estática (export) no admite PPR, así que ahí se apagan estas dos.
  ...(process.env.NEXT_OUTPUT === "export" ? {} : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
