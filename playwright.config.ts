import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5140",
    headless: true,
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_DEV === "1" ? "npm run dev" : "npm start",
    url: "http://127.0.0.1:5140/api/auth/me",
    env: {
      PORT: "5140",
      STORAGE_MODE: "memory",
      DATABASE_URL: "",
      OPENAI_API_KEY: "",
      OPENAI_BASE_URL: "",
      ORGANIZATION_REVIEWER_IDS: "",
      COOKIE_SECURE: "false",
    },
    reuseExistingServer: false,
  },
});
