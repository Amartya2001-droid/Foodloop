import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

test("memory organization detail joins supplier fixtures without a database", async () => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "tests/fixtures/memory-server.ts"],
    {
      env: {
        ...process.env,
        STORAGE_MODE: "memory",
        DATABASE_URL: "",
        OPENAI_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const base = "http://127.0.0.1:5125";
  try {
    let response;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(output);
      try {
        response = await fetch(`${base}/api/organizations`);
        if (response.ok) break;
      } catch {}
      await delay(100);
    }
    assert.ok(response?.ok, output);
    const organizations = await response.json();
    assert.equal(organizations.length, 1);
    const detail = await fetch(
      `${base}/api/organizations/${organizations[0].id}`,
    );
    assert.equal(detail.status, 200);
    const organization = await detail.json();
    assert.equal(organization.verified, false);
    assert.equal(organization.suppliers.length, 1);
    assert.equal(
      organization.suppliers[0].supplierName,
      "verification-supplier",
    );
    assert.equal(organization.suppliers[0].activeListings, 1);
    assert.equal(organization.suppliers[0].totalListings, 1);
    assert.equal(
      (await fetch(`${base}/api/organizations/missing`)).status,
      404,
    );
    const listings = await (await fetch(`${base}/api/food-listings`)).json();
    const readings = await (
      await fetch(`${base}/api/food-listings/${listings[0].id}/readings`)
    ).json();
    assert.equal(readings.stale, true);
    assert.equal(readings.readings[0].source, "unknown");
    assert.equal(organization.suppliers[0].overallRating, undefined);
    assert.equal(organization.suppliers[0].completedPickups, 0);
    assert.equal(
      (
        await fetch(`${base}/api/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) =>
      child.exitCode !== null ? resolve() : child.once("exit", resolve),
    );
  }
});
