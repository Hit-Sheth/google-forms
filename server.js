const { createServer } = require("http");
const next = require("next");
const fs = require("fs");
const path = require("path");

process.env.TURBOPACK = '0';
process.env.NEXT_PRIVATE_TURBOPACK = '0';

const dev = process.env.NODE_ENV !== "production";

// Clear the .next folder in development to avoid Turbopack panics from leftover cache
if (dev) {
  const nextDir = path.join(__dirname, ".next");
  if (fs.existsSync(nextDir)) {
    console.log("Clearing .next cache directory to prevent Turbopack errors...");
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
    } catch (err) {
      console.warn("Failed to clear .next directory:", err.message);
    }
  }
}

// turbopack: false is the correct option if supported, but clearing .next is what stops the panic
const app = next({ 
  dev, 
  dir: __dirname
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const { initSocket } = require("./src/lib/socket");

  initSocket(server);

  server.listen(3000, () => {
    console.log("Server running on port 3000");
  });
});