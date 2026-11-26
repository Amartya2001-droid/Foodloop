import { applyConfig, ConfigurationError, readConfig } from "./config";

async function main() {
  // Validate before runtime imports can initialize a database, AI client or Vite.
  const config = readConfig(process.env);
  applyConfig(config);
  const { startServer } = await import("./app");
  await startServer(config);
}

void main().catch((error) => {
  // Only our value-free messages are printable. Never expose dependency errors,
  // connection strings, account IDs or credentials in startup output.
  console.error(
    error instanceof ConfigurationError
      ? error.message
      : "Server initialization failed; check deployment configuration and runtime resources",
  );
  process.exit(1);
});
