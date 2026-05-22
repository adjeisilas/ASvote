import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  }).listen(3000, () => {
    console.log("> Next.js Server listening on port 3000 natively");
  });
}).catch((err) => {
  console.error("Failed to start custom server:", err);
  process.exit(1);
});
