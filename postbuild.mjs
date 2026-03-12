import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

// Copy static assets into standalone so the self-contained server can serve them
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
}

cpSync(
  join(root, ".next", "static"),
  join(standalone, ".next", "static"),
  { recursive: true }
);

// Copy server.js to project root so `npm start` works from the deployment directory
cpSync(join(standalone, "server.js"), join(root, "server.js"));

console.log("✓ Standalone assets and server.js copied successfully");
