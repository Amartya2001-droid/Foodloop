import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { client, register, listingForm } from "./helpers.mjs";
process.env.STORAGE_MODE = "memory";
process.env.DATABASE_URL = "";
process.env.OPENAI_API_KEY = "";
const { registerRoutes } = await import("../server/routes.ts");
const { storage } = await import("../server/storage.ts");
const { SESSION_TTL_MS } = await import("../server/auth.ts");
async function start(now) {
  const app = express();
  app.use(express.json());
  const server = await registerRoutes(app, { now });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
test("server rejects an expired session cookie at exactly twelve hours and permits fresh login", async () => {
  let time = Date.now();
  const started = time;
  const app = await start(() => time);
  try {
    const account = client(app.base);
    const user = await register(account, "expiry-boundary");
    const stored = await storage.getUser(user.id);
    assert.match(stored.password, /^scrypt:/);
    assert.notEqual(stored.password, "local-test-password-only");
    const login = await fetch(app.base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "expiry-boundary",
        password: "local-test-password-only",
      }),
    });
    assert.equal(login.status, 200);
    const rawCookie = login.headers.get("set-cookie").split(";")[0];
    assert.match(login.headers.get("set-cookie"), /Max-Age=43200/);
    const raw = (path, method = "GET", body) =>
      fetch(app.base + path, {
        method,
        headers: { Cookie: rawCookie, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    time = started + SESSION_TTL_MS - 1;
    assert.equal((await raw("/api/my-listings")).status, 200);
    time = started + SESSION_TTL_MS;
    assert.deepEqual(await (await raw("/api/auth/me")).json(), { user: null });
    assert.equal((await raw("/api/my-listings")).status, 401);
    assert.equal((await raw("/api/organizations", "POST", {})).status, 401);
    assert.equal((await raw("/api/reservations")).status, 401);
    time += 1;
    assert.equal((await raw("/api/my-listings")).status, 401);
    const fresh = await account("/api/auth/login", "POST", {
      username: "expiry-boundary",
      password: "local-test-password-only",
    });
    assert.equal(fresh.status, 200);
    assert.notEqual(fresh.headers.get("set-cookie").split(";")[0], rawCookie);
    assert.equal((await account("/api/my-listings")).status, 200);
    assert.equal((await raw("/api/my-listings")).status, 401);
    await account("/api/auth/logout", "POST");
    assert.equal((await account("/api/my-listings")).status, 401);
  } finally {
    await app.close();
  }
});
test("organization consent, role boundaries, revocation and independent review audit", async () => {
  const app = await start(Date.now);
  try {
    const owner = client(app.base),
      member = client(app.base),
      manager = client(app.base),
      outsider = client(app.base),
      reviewer = client(app.base),
      anonymous = client(app.base);
    const ownerUser = await register(owner, "organization-owner");
    const memberUser = await register(member, "organization-member");
    await register(manager, "organization-manager");
    const outsiderUser = await register(outsider, "organization-outsider");
    const reviewerUser = await register(reviewer, "organization-reviewer");
    process.env.ORGANIZATION_REVIEWER_IDS = "";
    const profile = {
      name: "Test pantry",
      type: "food_bank",
      description: "Synthetic integration-test organization",
      location: "Test entrance",
      latitude: 44,
      longitude: -63,
      contactEmail: "test@example.invalid",
      contactPhone: "Test contact",
    };
    const created = await owner("/api/organizations", "POST", {
      ...profile,
      verified: true,
      ownerId: outsiderUser.id,
    });
    assert.equal(created.status, 201);
    const org = await created.json();
    assert.equal(org.ownerId, ownerUser.id);
    assert.equal(org.verified, false);
    const legacy = await storage.createOrganization({
      ...profile,
      name: "Legacy flag fixture",
      ownerId: ownerUser.id,
      verified: true,
    });
    assert.equal(
      (await (await anonymous(`/api/organizations/${legacy.id}`)).json())
        .verified,
      false,
    );
    const root = `/api/organizations/${org.id}`;
    const access = async (who) => (await who(root + "/access")).json();
    assert.equal((await anonymous(root + "/access")).status, 401);
    assert.equal(
      (
        await outsider(root + "/memberships", "POST", {
          username: "organization-member",
          role: "member",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-member",
          role: "owner",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-owner",
          role: "member",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-member",
          role: "member",
        })
      ).status,
      200,
    );
    const invitation = (
      await (await member("/api/organization-invitations")).json()
    )[0];
    const memberAction = (who, action, extra = {}) =>
      who(root + `/memberships/${invitation.id}/actions`, "POST", {
        action,
        ...extra,
      });
    assert.equal((await outsider(root + "/access")).status, 200);
    assert.deepEqual((await access(outsider)).memberships, []);
    assert.deepEqual(await (await member("/api/my-organizations")).json(), []);
    assert.equal(
      (
        await member(
          "/api/food-listings",
          "POST",
          listingForm({ organizationId: org.id }),
        )
      ).status,
      403,
    );
    assert.equal((await memberAction(owner, "accept")).status, 403);
    assert.equal((await memberAction(member, "accept")).status, 200);
    assert.equal((await memberAction(member, "accept")).status, 409);
    assert.equal((await access(member)).role, "member");
    assert.equal((await access(member)).canEdit, false);
    assert.equal(
      (await (await member("/api/my-organizations")).json()).length,
      1,
    );
    const donation = await member(
      "/api/food-listings",
      "POST",
      listingForm({ organizationId: org.id }),
    );
    assert.equal(donation.status, 201);
    const listing = await donation.json();
    assert.equal(
      (await owner(`/api/food-listings/${listing.id}`, "DELETE")).status,
      403,
    );
    assert.equal(
      (await member(root + "/profile", "POST", { name: "Not allowed" })).status,
      403,
    );
    assert.equal(
      (
        await member(root + "/memberships", "POST", {
          username: "organization-outsider",
          role: "manager",
        })
      ).status,
      403,
    );
    assert.equal(
      (await memberAction(member, "role", { role: "manager" })).status,
      403,
    );
    assert.equal(
      (await memberAction(owner, "role", { role: "manager" })).status,
      200,
    );
    assert.equal(
      (
        await member(root + "/profile", "POST", {
          description: "Manager updated profile",
        })
      ).status,
      200,
    );
    assert.equal(
      (await member(root + "/profile", "POST", { verified: true })).status,
      400,
    );
    assert.equal(
      (
        await member(root + "/verification-requests", "POST", {
          evidence: "Synthetic evidence for policy tests",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await owner(root + "/verification-requests", "POST", {
          evidence: "Synthetic test reference, not real accreditation",
        })
      ).status,
      200,
    );
    assert.equal((await access(owner)).reviewerConfigured, false);
    let review = (await access(owner)).reviews.find(
      (row) => row.status === "pending",
    );
    const decide = (who, decision = "approved", extra = {}) =>
      who(root + `/verification-requests/${review.id}/review`, "POST", {
        decision,
        note: "Synthetic policy-test review rationale",
        ...extra,
      });
    assert.equal((await decide(outsider)).status, 403);
    assert.equal(
      (await decide(outsider, "approved", { authorizedReviewer: true })).status,
      400,
    );
    process.env.ORGANIZATION_REVIEWER_IDS = `${reviewerUser.id},${ownerUser.id},${memberUser.id}`;
    assert.equal((await decide(owner)).status, 403);
    assert.equal((await decide(member)).status, 403);
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-reviewer",
          role: "member",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await owner(root + "/verification-requests", "POST", {
          evidence: "Duplicate pending synthetic evidence",
        })
      ).status,
      409,
    );
    assert.equal(
      (await (await reviewer("/api/organization-review-queue")).json()).length,
      1,
    );
    assert.equal((await decide(reviewer, "rejected")).status, 200);
    assert.equal((await (await anonymous(root)).json()).verified, false);
    assert.equal(
      (
        await owner(root + "/verification-requests", "POST", {
          evidence: "Revised synthetic test reference for resubmission",
        })
      ).status,
      200,
    );
    review = (await access(owner)).reviews.find(
      (row) => row.status === "pending",
    );
    const responses = await Promise.all([decide(reviewer), decide(reviewer)]);
    assert.deepEqual(responses.map((row) => row.status).sort(), [200, 409]);
    const publicOrg = await (await anonymous(root)).json();
    assert.equal(publicOrg.verified, true);
    assert.equal(publicOrg.verificationStatus, "reviewed");
    assert.ok(publicOrg.reviewedAt);
    assert.equal(publicOrg.reviews, undefined);
    assert.deepEqual((await access(outsider)).reviews, []);
    const approved = (await access(owner)).reviews.find(
      (row) => row.status === "approved",
    );
    assert.equal(approved.reviewedBy, reviewerUser.id);
    assert.ok(approved.reviewedAt);
    assert.match(approved.note, /Synthetic/);
    assert.equal(
      (
        await member(root + "/profile", "POST", {
          name: "Changed after review",
        })
      ).status,
      200,
    );
    assert.equal((await (await anonymous(root)).json()).verified, false);
    assert.equal(
      (
        await owner(root + "/verification-requests", "POST", {
          evidence: "Another synthetic request to test invalidation",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await member(root + "/profile", "POST", {
          description: "Edit while review pending",
        })
      ).status,
      200,
    );
    assert.ok(
      (await access(owner)).reviews.some((row) => row.status === "superseded"),
    );
    assert.equal((await memberAction(owner, "remove")).status, 200);
    assert.equal(
      (await member(root + "/profile", "POST", { name: "Revoked" })).status,
      403,
    );
    assert.equal(
      (
        await member(
          "/api/food-listings",
          "POST",
          listingForm({ organizationId: org.id }),
        )
      ).status,
      403,
    );
    assert.equal((await access(member)).role, null);
    assert.equal(
      (
        await owner(root + "/verification-requests", "POST", {
          evidence: "Independent review must reject former-member reviewer",
        })
      ).status,
      200,
    );
    review = (await access(owner)).reviews.find(
      (row) => row.status === "pending",
    );
    assert.equal((await decide(member)).status, 403);
    process.env.ORGANIZATION_REVIEWER_IDS = reviewerUser.id;
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-manager",
          role: "manager",
        })
      ).status,
      200,
    );
    const managerInvite = (
      await (await manager("/api/organization-invitations")).json()
    )[0];
    assert.equal(
      (
        await manager(
          root + `/memberships/${managerInvite.id}/actions`,
          "POST",
          { action: "decline" },
        )
      ).status,
      200,
    );
    assert.equal(
      (await manager(root + "/profile", "POST", { name: "Declined invite" }))
        .status,
      403,
    );
    assert.equal(
      (
        await owner(root + "/memberships", "POST", {
          username: "organization-manager",
          role: "manager",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await manager(
          root + `/memberships/${managerInvite.id}/actions`,
          "POST",
          { action: "accept" },
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await manager(
          root + `/memberships/${managerInvite.id}/actions`,
          "POST",
          { action: "remove" },
        )
      ).status,
      200,
    );
    assert.equal((await access(manager)).role, null);
  } finally {
    delete process.env.ORGANIZATION_REVIEWER_IDS;
    await app.close();
  }
});
