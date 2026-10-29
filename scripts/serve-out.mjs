import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = process.argv[2], port = Number(process.argv[3]);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".txt": "text/plain", ".woff2": "font/woff2" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const tries = [p, p + ".html", path.join(p, "index.html")];
  for (const t of tries) { const f = path.join(root, t); if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "Content-Type": types[path.extname(f)] ?? "application/octet-stream" }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(404); res.end("404");
}).listen(port, () => console.log("listo", port));
