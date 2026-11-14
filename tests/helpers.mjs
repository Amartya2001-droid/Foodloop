import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
export async function server(port, overrides = {}) {
  const child = spawn(process.execPath, ["dist/index.js"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      STORAGE_MODE: "memory",
      DATABASE_URL: "",
      OPENAI_API_KEY: "",
      PORT: String(port),
      ...overrides,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      if ((await fetch(`${base}/api/auth/me`)).ok) break;
    } catch {}
    await delay(100);
  }
  return {
    base,
    close: async () => {
      child.kill();
      await new Promise((r) =>
        child.exitCode !== null ? r() : child.once("exit", r),
      );
    },
  };
}
export function client(base) {
  let cookie = "";
  return async (path, method = "GET", body, extraHeaders = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...extraHeaders,
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    return response;
  };
}
export async function register(request, username) {
  const response = await request("/api/auth/register", "POST", {
    username,
    password: "local-test-password-only",
  });
  assert.equal(response.status, 201);
  return (await response.json()).user;
}
export function listingForm(extra = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    title: "Fresh bread",
    description: "Baked today. Contains wheat.",
    quantity: "2 loaves",
    category: "bakery",
    location: "Community entrance",
    latitude: "44.65",
    longitude: "-63.58",
    ...extra,
  }))
    form.set(key, value);
  return form;
}
