// Isolated signal/drain harness. Not imported by the production server.
import express from "express";
import { createServer } from "node:http";
import {
  Lifecycle,
  installHealthRoutes,
  installShutdownHandlers,
} from "../../server/lifecycle";
const app = express();
const lifecycle = new Lifecycle(async () => {});
const send = (message: unknown) =>
  new Promise<void>((resolve) => process.send!(message, () => resolve()));
installHealthRoutes(app, lifecycle);
app.get("/slow", async (_req, res) => {
  await send({ event: "inflight" });
  if (process.env.LIFECYCLE_FIXTURE_MODE === "stuck-request") return;
  await new Promise<void>((resolve) =>
    process.once("message", () => resolve()),
  );
  res.json({ completed: true });
});
const server = createServer(app);
installShutdownHandlers(
  server,
  lifecycle,
  async () => {
    await send({ event: "cleanup" });
    if (process.env.LIFECYCLE_FIXTURE_MODE === "stuck-cleanup")
      await new Promise(() => {});
  },
  { deadlineMs: process.env.LIFECYCLE_FIXTURE_MODE === "healthy" ? 1500 : 100 },
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    void send({ event: "draining", draining: lifecycle.draining });
  });
server.listen(0, "127.0.0.1", async () => {
  lifecycle.markServing();
  await send({
    event: "listening",
    port: (server.address() as { port: number }).port,
  });
});
