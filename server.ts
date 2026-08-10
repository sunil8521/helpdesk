 
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
      if (req.url === "/api/internal/socket-emit" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            const io = require("./lib/chat/socket-server").getIO();
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
