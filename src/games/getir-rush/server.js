import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  const requested = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const path = normalize(join(root, requested));
  if (!path.startsWith(root)) return res.writeHead(403).end("Forbidden");
  try {
    res.writeHead(200, { "Content-Type": `${types[extname(path)] || "application/octet-stream"}; charset=utf-8` });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(4173, "127.0.0.1", () => console.log("Getir Rush: http://localhost:4173"));
