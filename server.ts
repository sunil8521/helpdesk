import { AsyncLocalStorage } from "async_hooks";
import { createServer } from "http";

const globalWithAsyncLocalStorage = globalThis as typeof globalThis & {
  AsyncLocalStorage?: typeof AsyncLocalStorage;
};

if (typeof globalWithAsyncLocalStorage.AsyncLocalStorage !== "function") {
  globalWithAsyncLocalStorage.AsyncLocalStorage = AsyncLocalStorage;
}

  const dev = process.env.NODE_ENV !== "production";
  const hostname = "0.0.0.0";
  const port = parseInt(process.env.PORT!, 10);

  async function main() {
    const [{ default: next }, { getIO, initSocketServer }] = await Promise.all([
      import("next"),
      import("./lib/chat/socket-server"),
    ]);
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    const httpServer = createServer((req, res) => {
      if (req.url === "/api/internal/socket-emit" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            const io = getIO();
            if (io && data.room && data.event && data.payload) {
              io.to(data.room).emit(data.event, data.payload);
            }
            res.writeHead(200);
            res.end("ok");
          } catch (e) {
            res.writeHead(500);
            res.end("error");
          }
        });
        return;
      }
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
