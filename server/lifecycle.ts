import type { Express } from "express";
import type { Server, IncomingMessage, ServerResponse } from "node:http";

export const READINESS_TIMEOUT_MS = 1000;
export const SHUTDOWN_TIMEOUT_MS = 10000;

export class Lifecycle {
  private phase: "starting" | "serving" | "draining" = "starting";
  private pendingProbe?: Promise<boolean>;
  constructor(
    private readonly probeStorage: () => Promise<void>,
    private readonly probeTimeoutMs = READINESS_TIMEOUT_MS,
  ) {}

  markServing() {
    if (this.phase === "starting") this.phase = "serving";
  }
  beginDrain() {
    this.phase = "draining";
  }
  get draining() {
    return this.phase === "draining";
  }

  async ready(): Promise<boolean> {
    if (this.phase !== "serving") return false;
    // Keep the underlying operation until it settles, even after the HTTP timeout.
    // A slow/unresponsive database cannot create unlimited overlapping probes.
    if (!this.pendingProbe) {
      const pending = Promise.resolve()
        .then(this.probeStorage)
        .then(
          () => true,
          () => false,
        );
      this.pendingProbe = pending;
      void pending.then(() => {
        if (this.pendingProbe === pending) this.pendingProbe = undefined;
      });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const healthy = await Promise.race([
        this.pendingProbe,
        new Promise<false>((resolve) => {
          timer = setTimeout(() => resolve(false), this.probeTimeoutMs);
        }),
      ]);
      return healthy && !this.draining;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function installHealthRoutes(app: Express, lifecycle: Lifecycle) {
  app.get("/health/live", (_req, res) => {
    res.set("Cache-Control", "no-store").json({ status: "alive" });
  });
  app.get("/health/ready", async (_req, res) => {
    const ready = await lifecycle.ready();
    res
      .set("Cache-Control", "no-store")
      .status(ready ? 200 : 503)
      .json({ status: ready ? "ready" : "not_ready" });
  });
  app.use((_req, res, next) => {
    if (lifecycle.draining) {
      res
        .set({ Connection: "close", "Retry-After": "1" })
        .status(503)
        .json({ error: "Server is shutting down" });
      return;
    }
    next();
  });
}

export async function drainServer(
  server: Server,
  closeResources: () => Promise<void>,
  deadlineMs = SHUTDOWN_TIMEOUT_MS,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const drained = new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeIdleConnections();
  })
    .then(closeResources)
    .then(
      () => true,
      () => false,
    );
  try {
    const clean = await Promise.race([
      drained,
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), deadlineMs);
      }),
    ]);
    if (!clean) server.closeAllConnections();
    return clean;
  } finally {
    clearTimeout(timer);
  }
}

export function installShutdownHandlers(
  server: Server,
  lifecycle: Lifecycle,
  closeResources: () => Promise<void>,
  options: { deadlineMs?: number; exit?: (code: number) => void } = {},
) {
  let stopping = false;
  // Idle sockets are closed by server.close(), but a socket that was active at
  // drain start must also finish with a graceful FIN after its response flushes.
  const trackResponse = (req: IncomingMessage, res: ServerResponse) => {
    res.once("finish", () => {
      if (stopping) req.socket.end();
    });
  };
  server.on("request", trackResponse);
  const stop = () => {
    if (stopping) return;
    stopping = true;
    lifecycle.beginDrain();
    void drainServer(server, closeResources, options.deadlineMs).then(
      (clean) => {
        (options.exit ?? ((code) => process.exit(code)))(clean ? 0 : 1);
      },
    );
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  return () => {
    process.off("SIGTERM", stop);
    process.off("SIGINT", stop);
    server.off("request", trackResponse);
  };
}
