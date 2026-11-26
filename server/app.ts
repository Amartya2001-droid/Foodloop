import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import {
  Lifecycle,
  installHealthRoutes,
  installShutdownHandlers,
} from "./lifecycle";
import { ConfigurationError, type RuntimeConfig } from "./config";
import { verifyStartupStorage } from "./startup";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export async function startServer(config: RuntimeConfig) {
  // No HTTP listener exists until required storage and reviewer references pass.
  await verifyStartupStorage(config, storage);
  const app = express();
  const lifecycle = new Lifecycle(() => storage.checkHealth());
  installHealthRoutes(app, lifecycle);
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    res.on("finish", () => {
      if (path.startsWith("/api"))
        log(
          `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`.slice(
            0,
            80,
          ),
        );
    });
    next();
  });
  const server = await registerRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res
      .status(status)
      .json({ message: err.message || "Internal Server Error" });
    console.error("Request failed", status);
  });
  let closeFrontend = async () => {};
  if (config.nodeEnv === "development") {
    const vite = await setupVite(app, server, () => lifecycle.draining);
    closeFrontend = () => vite.close();
  } else serveStatic(app);
  installShutdownHandlers(server, lifecycle, async () => {
    log("HTTP drained; closing runtime resources");
    await Promise.all([storage.close(), closeFrontend()]);
    log("Runtime resources closed");
  });
  await new Promise<void>((resolve, reject) => {
    const failed = (error: NodeJS.ErrnoException) =>
      reject(
        new ConfigurationError([
          error.code === "EADDRINUSE"
            ? "PORT is already in use"
            : error.code === "EACCES"
              ? "PORT cannot be bound by this process"
              : "HTTP listener could not start; check PORT and host permissions",
        ]),
      );
    server.once("error", failed);
    server.listen(
      { port: config.port, host: "0.0.0.0", reusePort: true },
      () => {
        server.off("error", failed);
        lifecycle.markServing();
        log(`serving on port ${config.port}`);
        resolve();
      },
    );
  });
}
