// Exercise the actual Vite logger adapter without serving traffic or using storage.
import express from "express";
import { createServer } from "node:http";
import { setupVite } from "../../server/vite";
const app = express();
const mode = process.argv[2];
const vite = await setupVite(
  app,
  createServer(app),
  () => mode !== "running-cancellation",
);
vite.config.logger.error(
  mode === "unexpected-during-drain"
    ? "Unexpected development compilation failure"
    : "The build was canceled",
);
await vite.close();
process.exit(0);
