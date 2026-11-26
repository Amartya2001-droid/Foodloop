export class ConfigurationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(
      `Startup configuration invalid:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    this.name = "ConfigurationError";
  }
}
export interface RuntimeConfig {
  nodeEnv: "development" | "production" | "test";
  storageMode: "memory" | "database";
  port: number;
  cookieSecure: boolean;
  databaseUrl?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  reviewerIds: string[];
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Values never appear in validation messages (URLs and tokens may contain secrets).
export function readConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const issues: string[] = [];
  const nodeEnv = env.NODE_ENV ?? "development";
  if (!["development", "production", "test"].includes(nodeEnv))
    issues.push("NODE_ENV must be development, production or test");
  const storageMode = env.STORAGE_MODE ?? "database";
  if (!["memory", "database"].includes(storageMode))
    issues.push("STORAGE_MODE must be memory or database");
  const portText = env.PORT ?? "5000";
  const port = Number(portText);
  if (
    !/^\d+$/.test(portText) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    issues.push("PORT must be a decimal integer from 1 to 65535");
  const cookieText = env.COOKIE_SECURE ?? "false";
  if (!["true", "false"].includes(cookieText))
    issues.push("COOKIE_SECURE must be true or false");

  const databaseUrl = env.DATABASE_URL || undefined;
  if (storageMode === "database" && !databaseUrl)
    issues.push(
      "DATABASE_URL is required when STORAGE_MODE is database (the default); choose STORAGE_MODE=memory for local ephemeral runs",
    );
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      if (
        /\s/.test(databaseUrl) ||
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        !url.hostname ||
        !url.pathname ||
        url.pathname === "/" ||
        url.hash
      )
        throw new Error();
    } catch {
      issues.push(
        "DATABASE_URL must be a PostgreSQL URL with a hostname and database name, without raw whitespace or a fragment",
      );
    }
  }
  const openaiApiKey = env.OPENAI_API_KEY || undefined;
  if (openaiApiKey && /\s/.test(openaiApiKey))
    issues.push("OPENAI_API_KEY must be a token without whitespace");
  const openaiBaseUrl = env.OPENAI_BASE_URL || undefined;
  if (openaiBaseUrl) {
    try {
      const url = new URL(openaiBaseUrl);
      const localHttp =
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (
        /\s/.test(openaiBaseUrl) ||
        (url.protocol !== "https:" && !localHttp) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error();
    } catch {
      issues.push(
        "OPENAI_BASE_URL must be an HTTPS URL (or loopback HTTP for a local stub), without userinfo, query or fragment",
      );
    }
    if (!openaiApiKey)
      issues.push(
        "OPENAI_API_KEY is required when OPENAI_BASE_URL is set; leave both unset to disable optional AI",
      );
  }
  const reviewerText = env.ORGANIZATION_REVIEWER_IDS ?? "";
  const reviewerIds =
    reviewerText === ""
      ? []
      : reviewerText.split(",").map((value) => value.trim().toLowerCase());
  if (
    reviewerIds.some((id) => !uuid.test(id)) ||
    new Set(reviewerIds).size !== reviewerIds.length
  )
    issues.push(
      "ORGANIZATION_REVIEWER_IDS must contain unique, comma-separated UUID account IDs selected by Amartya, without empty entries",
    );
  if (issues.length) throw new ConfigurationError(issues);
  return {
    nodeEnv: nodeEnv as RuntimeConfig["nodeEnv"],
    storageMode: storageMode as RuntimeConfig["storageMode"],
    port,
    cookieSecure: cookieText === "true",
    databaseUrl,
    openaiApiKey,
    openaiBaseUrl,
    reviewerIds,
  };
}

export function applyConfig(config: RuntimeConfig) {
  process.env.NODE_ENV = config.nodeEnv;
  process.env.STORAGE_MODE = config.storageMode;
  process.env.PORT = String(config.port);
  process.env.COOKIE_SECURE = String(config.cookieSecure);
  process.env.ORGANIZATION_REVIEWER_IDS = config.reviewerIds.join(",");
}
