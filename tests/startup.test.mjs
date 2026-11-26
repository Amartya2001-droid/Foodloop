import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { server as memoryServer } from "./helpers.mjs";

async function rejectedStartup(mode, overrides, field) {
  const env = {
    ...process.env,
    NODE_ENV: mode,
    STORAGE_MODE: "memory",
    DATABASE_URL: "",
    OPENAI_API_KEY: "",
    OPENAI_BASE_URL: "",
    ORGANIZATION_REVIEWER_IDS: "",
    COOKIE_SECURE: "false",
    PORT: "5171",
    ...overrides,
  };
  for (const [key, value] of Object.entries(env))
    if (value === undefined) delete env[key];
  const child = spawn(
    process.execPath,
    mode === "development"
      ? ["--import", "tsx", "server/index.ts"]
      : ["dist/index.js"],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "",
    listened = false;
  const consume = (chunk) => {
    output += chunk;
    // A regression on the old runtime must fail promptly without ever sending
    // a database/API request to the incorrectly started listener.
    if (!listened && output.includes("serving on port")) {
      listened = true;
      child.kill("SIGTERM");
    }
  };
  child.stdout.on("data", consume);
  child.stderr.on("data", consume);
  try {
    const [code, signal] = await once(child, "close", {
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(listened, false, `Invalid ${field} reached an HTTP listener`);
    assert.equal(code, 1, output);
    assert.equal(signal, null);
    assert.match(output, new RegExp(field));
    return output;
  } finally {
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL");
  }
}
for (const mode of ["production", "development"]) {
  test(`${mode}: missing default DATABASE_URL is rejected before listening`, async () => {
    await rejectedStartup(
      mode,
      { STORAGE_MODE: undefined, DATABASE_URL: undefined },
      "DATABASE_URL",
    );
  });
}
for (const [name, overrides, field] of [
  [
    "malformed database URL",
    { STORAGE_MODE: "database", DATABASE_URL: "not-a-url" },
    "DATABASE_URL",
  ],
  ["junk-suffixed port", { PORT: "5171junk" }, "PORT"],
  ["out-of-range port with a named error", { PORT: "65536" }, "PORT"],
  ["invalid storage mode", { STORAGE_MODE: "invalid-mode" }, "STORAGE_MODE"],
  ["invalid node environment", { NODE_ENV: "invalid-mode" }, "NODE_ENV"],
  ["ambiguous cookie boolean", { COOKIE_SECURE: "yes" }, "COOKIE_SECURE"],
  [
    "malformed reviewer reference",
    { ORGANIZATION_REVIEWER_IDS: "not-an-account-id" },
    "ORGANIZATION_REVIEWER_IDS",
  ],
  [
    "nonexistent reviewer reference in a fresh memory store",
    { ORGANIZATION_REVIEWER_IDS: randomUUID() },
    "ORGANIZATION_REVIEWER_IDS",
  ],
  [
    "malformed optional AI base",
    { OPENAI_BASE_URL: "not-a-url" },
    "OPENAI_BASE_URL",
  ],
  [
    "configured AI override without its token",
    { OPENAI_BASE_URL: "http://127.0.0.1:5130/v1" },
    "OPENAI_API_KEY",
  ],
]) {
  test(`built server rejects ${name} before listening`, async () => {
    await rejectedStartup("production", overrides, field);
  });
}
test("built server aggregates configuration errors without echoing supplied values", async () => {
  const canary = randomBytes(24).toString("hex");
  const output = await rejectedStartup(
    "production",
    {
      DATABASE_URL: `invalid-${canary}`,
      PORT: canary,
      OPENAI_API_KEY: ` ${canary}`,
      ORGANIZATION_REVIEWER_IDS: canary,
    },
    "DATABASE_URL",
  );
  for (const field of ["PORT", "OPENAI_API_KEY", "ORGANIZATION_REVIEWER_IDS"])
    assert.match(output, new RegExp(field));
  assert.ok(!output.includes(canary));
  assert.doesNotMatch(output, /at .*server\//);
});
test("port bind failure names PORT rather than emitting an uncaught server event", async () => {
  const occupied = createServer();
  await new Promise((resolve) => occupied.listen(0, "127.0.0.1", resolve));
  try {
    const output = await rejectedStartup(
      "production",
      { PORT: String(occupied.address().port) },
      "PORT",
    );
    assert.match(output, /PORT is already in use/);
    assert.doesNotMatch(output, /Unhandled|node:net/);
  } finally {
    await new Promise((resolve) => occupied.close(resolve));
  }
});
test("explicit built memory mode starts without credentials and exposes the health contract", async () => {
  const app = await memoryServer(5172);
  try {
    for (const [path, status] of [
      ["/health/live", "alive"],
      ["/health/ready", "ready"],
    ]) {
      const response = await fetch(app.base + path);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status });
    }
    assert.deepEqual(await (await fetch(app.base + "/api/auth/me")).json(), {
      user: null,
    });
  } finally {
    assert.equal(await app.close(), 0);
  }
});
