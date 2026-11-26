import { ConfigurationError, type RuntimeConfig } from "./config";
import type { IStorage } from "./storage";
export const STARTUP_TIMEOUT_MS = 5000;

export async function verifyStartupStorage(
  config: RuntimeConfig,
  storage: Pick<IStorage, "checkHealth" | "getUser">,
  timeoutMs = STARTUP_TIMEOUT_MS,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const verification = (async () => {
    try {
      await storage.checkHealth();
      for (const id of config.reviewerIds) {
        if (!(await storage.getUser(id)))
          throw new ConfigurationError([
            "ORGANIZATION_REVIEWER_IDS must name existing trusted user accounts selected by Amartya; leave it unset in a fresh memory store",
          ]);
      }
    } catch (error) {
      if (error instanceof ConfigurationError) throw error;
      throw new ConfigurationError([
        "Storage initialization failed; check DATABASE_URL, schema and connectivity for database mode",
      ]);
    }
  })();
  try {
    await Promise.race([
      verification,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new ConfigurationError([
                "Storage/reviewer verification timed out before HTTP startup; check DATABASE_URL and storage connectivity",
              ]),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
