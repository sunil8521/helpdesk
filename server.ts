// ---------------------------------------------------------------------------
// Custom Node.js server — runs both Next.js and Socket.IO on one port
// Usage: npx tsx server.ts
// ---------------------------------------------------------------------------

import { createServer } from "http";
import next from "next";
import { initSocketServer } from "./lib/chat/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.IO to the same HTTP server
  initSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`\n  ▸ Next.js + Socket.IO ready on http://${hostname}:${port}\n`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
