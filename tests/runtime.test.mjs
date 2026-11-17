import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  Lifecycle,
  installHealthRoutes,
  drainServer,
} from "../server/lifecycle.ts";
import { server as productionServer } from "./helpers.mjs";

async function listen(app) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

test("health HTTP probes cover startup, storage failure, bounded shared timeout and drain", async () => {
  let mode = "healthy",
    calls = 0,
    release;
  const lifecycle = new Lifecycle(async () => {
    calls++;
    if (mode === "failed")
      throw new Error("private-storage-error-must-not-leak");
    if (mode === "blocked")
      await new Promise((resolve) => {
        release = resolve;
      });
  }, 20);
  const app = express();
  installHealthRoutes(app, lifecycle);
  app.get("/", (_req, res) => res.send("app"));
  const runtime = await listen(app);
  const probe = () =>
    fetch(runtime.base + "/health/ready", {
      signal: AbortSignal.timeout(2000),
    });
  try {
    const live = await fetch(runtime.base + "/health/live");
    assert.equal(live.status, 200);
    assert.equal(live.headers.get("cache-control"), "no-store");
    assert.deepEqual(await live.json(), { status: "alive" });
    assert.equal((await probe()).status, 503);
    assert.equal(calls, 0);
    lifecycle.markServing();
    assert.deepEqual(await (await probe()).json(), { status: "ready" });
    mode = "failed";
    const failed = await probe();
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { status: "not_ready" });
    mode = "blocked";
    const before = calls;
    const blocked = await Promise.all([probe(), probe(), probe()]);
    for (const result of blocked) assert.equal(result.status, 503);
    assert.equal(calls, before + 1);
    assert.equal((await probe()).status, 503);
    assert.equal(calls, before + 1);
    lifecycle.beginDrain();
    release();
    lifecycle.markServing();
    assert.equal((await probe()).status, 503);
    assert.equal((await fetch(runtime.base + "/health/live")).status, 200);
    const rejected = await fetch(runtime.base);
    assert.equal(rejected.status, 503);
    assert.equal(rejected.headers.get("connection"), "close");
    assert.deepEqual(await rejected.json(), {
      error: "Server is shutting down",
    });
  } finally {
    runtime.server.closeAllConnections();
    await new Promise((resolve) => runtime.server.close(resolve));
  }
});

test("a storage result that arrives during drain cannot restore readiness", async () => {
  let release;
  const lifecycle = new Lifecycle(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  lifecycle.markServing();
  const pending = lifecycle.ready();
  await Promise.resolve();
  lifecycle.beginDrain();
  release();
  assert.equal(await pending, false);
});

test("resource cleanup failure produces unsuccessful shutdown", async () => {
  const { server } = await listen(express());
  assert.equal(
    await drainServer(server, async () => {
      throw new Error("fixture cleanup failure");
    }),
    false,
  );
});

async function fixture(mode) {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "tests/fixtures/lifecycle-server.ts"],
    {
      env: { ...process.env, LIFECYCLE_FIXTURE_MODE: mode },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  const messages = [];
  child.on("message", (message) => messages.push(message));
  const wait = async (event) => {
    const abort = AbortSignal.timeout(3000);
    while (!messages.some((message) => message.event === event))
      await once(child, "message", { signal: abort });
    return messages.find((message) => message.event === event);
  };
  const { port } = await wait("listening");
  return {
    child,
    messages,
    wait,
    base: `http://127.0.0.1:${port}`,
    cleanup: () => {
      if (child.exitCode === null) child.kill("SIGKILL");
    },
  };
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  test(`${signal} drains an active HTTP request, cleans resources, and exits zero`, async () => {
    const app = await fixture("healthy");
    try {
      const response = fetch(app.base + "/slow");
      await app.wait("inflight");
      const exited = once(app.child, "exit", {
        signal: AbortSignal.timeout(3000),
      });
      app.child.kill(signal);
      assert.equal((await app.wait("draining")).draining, true);
      await assert.rejects(
        fetch(app.base + "/health/live", { signal: AbortSignal.timeout(500) }),
      );
      app.child.send("release");
      assert.deepEqual(await (await response).json(), { completed: true });
      const [code, terminationSignal] = await exited;
      assert.equal(code, 0);
      assert.equal(terminationSignal, null);
      assert.ok(app.messages.some((message) => message.event === "cleanup"));
      await assert.rejects(fetch(app.base + "/health/live"));
    } finally {
      app.cleanup();
    }
  });
}

for (const mode of ["stuck-request", "stuck-cleanup"]) {
  test(`${mode} is bounded by the shutdown deadline and exits unsuccessfully`, async () => {
    const app = await fixture(mode);
    try {
      let response;
      if (mode === "stuck-request") {
        response = fetch(app.base + "/slow").catch(() => null);
        await app.wait("inflight");
      }
      const exited = once(app.child, "exit", {
        signal: AbortSignal.timeout(3000),
      });
      app.child.kill("SIGTERM");
      const [code, signal] = await exited;
      assert.equal(code, 1);
      assert.equal(signal, null);
      if (response) assert.equal(await response, null);
      if (mode === "stuck-cleanup")
        assert.ok(app.messages.some((message) => message.event === "cleanup"));
    } finally {
      app.cleanup();
    }
  });
}

test("built production memory server exposes probes and exits cleanly on SIGTERM", async () => {
  const app = await productionServer(5131);
  try {
    const live = await fetch(app.base + "/health/live");
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: "alive" });
    const ready = await fetch(app.base + "/health/ready");
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: "ready" });
  } finally {
    assert.equal(await app.close(), 0);
  }
});

for (const [mode, expectedCode] of [
  ["draining-cancellation", 0],
  ["running-cancellation", 1],
  ["unexpected-during-drain", 1],
]) {
  test(`Vite ${mode} exits with the correct runtime status`, async () => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "tests/fixtures/vite-logger.ts", mode],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let output = "";
    child.stderr.on("data", (chunk) => (output += chunk));
    try {
      const [code, signal] = await once(child, "exit", {
        signal: AbortSignal.timeout(10000),
      });
      assert.equal(signal, null);
      assert.equal(code, expectedCode, output);
    } finally {
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  });
}
