import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readConfig, ConfigurationError } from "../server/config.ts";
import { verifyStartupStorage } from "../server/startup.ts";
const memory = { STORAGE_MODE: "memory" };
const invalid = (env, field) =>
  assert.throws(
    () => readConfig(env),
    (error) =>
      error instanceof ConfigurationError && error.message.includes(field),
  );

test("database is the default and requires a URL; explicit memory defaults need no credentials", () => {
  invalid({}, "DATABASE_URL");
  invalid({ STORAGE_MODE: "database", DATABASE_URL: "" }, "DATABASE_URL");
  assert.deepEqual(readConfig(memory), {
    storageMode: "memory",
    nodeEnv: "development",
    port: 5000,
    cookieSecure: false,
    databaseUrl: undefined,
    openaiApiKey: undefined,
    openaiBaseUrl: undefined,
    reviewerIds: [],
  });
  // Syntax fixture only: this URL is never given to a driver or connected.
  assert.equal(
    readConfig({ DATABASE_URL: "postgresql://localhost/syntax_only" })
      .storageMode,
    "database",
  );
});

test("ports are strict decimal integers, not parseInt prefixes or ephemeral port zero", () => {
  for (const PORT of [
    "0",
    "65536",
    "5000trailing",
    "1e3",
    "1.5",
    "-1",
    " 5000",
    "",
  ])
    invalid({ ...memory, PORT }, "PORT");
  assert.equal(readConfig({ ...memory, PORT: "1" }).port, 1);
  assert.equal(readConfig({ ...memory, PORT: "65535" }).port, 65535);
});

test("unknown modes and ambiguous boolean settings fail rather than silently falling back", () => {
  for (const STORAGE_MODE of ["", "invalid", " memory"])
    invalid({ STORAGE_MODE }, "STORAGE_MODE");
  for (const NODE_ENV of ["", "invalid"])
    invalid({ ...memory, NODE_ENV }, "NODE_ENV");
  for (const COOKIE_SECURE of ["", "yes", "1", "FALSE"])
    invalid({ ...memory, COOKIE_SECURE }, "COOKIE_SECURE");
  assert.equal(
    readConfig({ ...memory, NODE_ENV: "production", COOKIE_SECURE: "true" })
      .cookieSecure,
    true,
  );
  assert.equal(
    readConfig({ ...memory, COOKIE_SECURE: "false" }).cookieSecure,
    false,
  );
});

test("database URL shape rejects invalid protocols, missing database names and fragments without connecting", () => {
  for (const DATABASE_URL of [
    "invalid",
    "https://example.invalid/db",
    "postgresql:///db",
    "postgresql://localhost",
    "postgresql://localhost/db#fragment",
    " postgresql://localhost/db",
  ])
    invalid({ ...memory, DATABASE_URL }, "DATABASE_URL");
});

test("optional AI is disabled with empty settings; configured overrides require safe URLs and a token", () => {
  const token = randomBytes(24).toString("hex"); // Ephemeral unit-test canary, never a real API key.
  assert.equal(
    readConfig({ ...memory, OPENAI_API_KEY: "", OPENAI_BASE_URL: "" })
      .openaiApiKey,
    undefined,
  );
  assert.equal(
    readConfig({ ...memory, OPENAI_API_KEY: token }).openaiApiKey,
    token,
  );
  invalid(
    { ...memory, OPENAI_BASE_URL: "http://127.0.0.1:5130/v1" },
    "OPENAI_API_KEY",
  );
  invalid({ ...memory, OPENAI_API_KEY: ` ${token}` }, "OPENAI_API_KEY");
  for (const OPENAI_BASE_URL of [
    "file:///tmp/provider",
    "http://example.invalid/v1",
    "https://example.invalid/v1?token=value",
    "https://example.invalid/v1#fragment",
    `https://${token}@example.invalid/v1`,
  ])
    invalid(
      { ...memory, OPENAI_API_KEY: token, OPENAI_BASE_URL },
      "OPENAI_BASE_URL",
    );
  for (const OPENAI_BASE_URL of [
    "https://example.invalid/v1",
    "http://127.0.0.1:5130/v1",
    "http://[::1]:5130/v1",
  ])
    assert.equal(
      readConfig({ ...memory, OPENAI_API_KEY: token, OPENAI_BASE_URL })
        .openaiBaseUrl,
      OPENAI_BASE_URL,
    );
});

test("reviewer list must be unique UUID references, never implicit role assignments", () => {
  const id = randomUUID();
  for (const ORGANIZATION_REVIEWER_IDS of [
    " ",
    "not-an-account-id",
    `${id},`,
    `${id},${id}`,
    `${id},${id.toUpperCase()}`,
  ])
    invalid(
      { ...memory, ORGANIZATION_REVIEWER_IDS },
      "ORGANIZATION_REVIEWER_IDS",
    );
  assert.deepEqual(
    readConfig({ ...memory, ORGANIZATION_REVIEWER_IDS: id.toUpperCase() })
      .reviewerIds,
    [id],
  );
});

test("configuration diagnostics aggregate field names without echoing supplied values", () => {
  const canary = randomBytes(24).toString("hex");
  assert.throws(
    () =>
      readConfig({
        STORAGE_MODE: "database",
        DATABASE_URL: `invalid-${canary}`,
        PORT: canary,
        OPENAI_API_KEY: ` ${canary}`,
        ORGANIZATION_REVIEWER_IDS: canary,
      }),
    (error) => {
      for (const field of [
        "DATABASE_URL",
        "PORT",
        "OPENAI_API_KEY",
        "ORGANIZATION_REVIEWER_IDS",
      ])
        assert.match(error.message, new RegExp(field));
      assert.ok(!error.message.includes(canary));
      return true;
    },
  );
});

test("startup checks storage before verifying that configured reviewer references exist", async () => {
  const id = randomUUID();
  const config = readConfig({ ...memory, ORGANIZATION_REVIEWER_IDS: id });
  const calls = [];
  await verifyStartupStorage(config, {
    checkHealth: async () => {
      calls.push("health");
    },
    getUser: async (value) => {
      calls.push(value);
      return { id: value };
    },
  });
  assert.deepEqual(calls, ["health", id]);
  await assert.rejects(
    verifyStartupStorage(config, {
      checkHealth: async () => {},
      getUser: async () => undefined,
    }),
    (error) =>
      error instanceof ConfigurationError &&
      /existing trusted user accounts/.test(error.message) &&
      !error.message.includes(id),
  );
});

test("startup dependency failures are redacted and both storage/reviewer work share one deadline", async () => {
  const canary = randomBytes(24).toString("hex");
  await assert.rejects(
    verifyStartupStorage(readConfig(memory), {
      checkHealth: async () => {
        throw new Error(canary);
      },
      getUser: async () => undefined,
    }),
    (error) =>
      /Storage initialization failed/.test(error.message) &&
      !error.message.includes(canary),
  );
  await assert.rejects(
    verifyStartupStorage(
      readConfig(memory),
      {
        checkHealth: () => new Promise(() => {}),
        getUser: async () => undefined,
      },
      10,
    ),
    /timed out before HTTP startup/,
  );
  await assert.rejects(
    verifyStartupStorage(
      readConfig({ ...memory, ORGANIZATION_REVIEWER_IDS: randomUUID() }),
      { checkHealth: async () => {}, getUser: () => new Promise(() => {}) },
      10,
    ),
    /timed out before HTTP startup/,
  );
});
