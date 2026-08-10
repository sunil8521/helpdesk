import { createServer } from "http";
import { initSocketServer, getIO } from "./lib/chat/socket-server";

const port = parseInt(process.env.WS_PORT!);
const hostname = "0.0.0.0";

const httpServer = createServer((req, res) => {
  // CORS Headers for the webhook endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Webhook for Next.js Server Actions to trigger Socket events
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
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error("Socket webhook error:", e);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

// Initialize Socket.IO
initSocketServer(httpServer);

httpServer.listen(port, hostname, () => {
  console.log(`\n  ▸ WebSocket server running on http://${hostname}:${port}\n`);
});
