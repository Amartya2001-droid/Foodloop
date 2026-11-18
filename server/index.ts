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

const app = express();
const lifecycle = new Lifecycle(() => storage.checkHealth());
installHealthRoutes(app, lifecycle);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}
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

(async () => {
  const server = await registerRoutes(app);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res
      .status(status)
      .json({ message: err.message || "Internal Server Error" });
    console.error("Request failed", status);
  });
  let closeFrontend = async () => {};
  if (app.get("env") === "development") {
    const vite = await setupVite(app, server, () => lifecycle.draining);
    closeFrontend = () => vite.close();
  } else serveStatic(app);

  installShutdownHandlers(server, lifecycle, async () => {
    log("HTTP drained; closing runtime resources");
    await Promise.all([storage.close(), closeFrontend()]);
    log("Runtime resources closed");
  });
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    lifecycle.markServing();
    log(`serving on port ${port}`);
  });
})().catch(() => {
  // Startup failures must not print connection strings or credentials.
  console.error("Server initialization failed");
  process.exit(1);
});
