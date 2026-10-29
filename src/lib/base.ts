// Carpeta donde vive la app publicada (en GitHub Pages es "/bluey-world"; en local, vacía).
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Ruta de un archivo de public/ con la carpeta de publicación delante. */
export const asset = (path: string) => `${BASE}${path}`;
