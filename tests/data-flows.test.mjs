import { test } from "node:test";
import assert from "node:assert/strict";
import { server, client, register, listingForm } from "./helpers.mjs";
test("real organization, sensor, observation, supplier and confirmed impact flows", async () => {
  const app = await server(5128);
  try {
    const donor = client(app.base),
      recipient = client(app.base),
      publicRead = client(app.base);
    const owner = await register(donor, "data-owner");
    await register(recipient, "data-recipient");
    const initial = await (await publicRead("/api/impact")).json();
    assert.equal(initial.completedPickups, 0);
    assert.equal(initial.reportedWeightKg, 0);
    assert.equal(initial.co2Prevented, null);
    assert.deepEqual(await (await publicRead("/api/suppliers")).json(), []);
    const orgResponse = await donor("/api/organizations", "POST", {
      name: "Local pantry",
      type: "food_bank",
      description: "User-created pantry",
      location: "Community hall",
      latitude: 44,
      longitude: -63,
      contactEmail: "test@example.invalid",
      contactPhone: "Local contact",
      ownerId: "spoofed",
      verified: true,
    });
    assert.equal(orgResponse.status, 201);
    const org = await orgResponse.json();
    assert.equal(org.ownerId, owner.id);
    assert.equal(org.verified, false);
    assert.equal(
      (
        await recipient(
          "/api/food-listings",
          "POST",
          listingForm({ organizationId: org.id }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await donor(
          "/api/food-listings",
          "POST",
          listingForm({ weightKg: "-1" }),
        )
      ).status,
      400,
    );
    const created = await donor(
      "/api/food-listings",
      "POST",
      listingForm({
        organizationId: org.id,
        weightKg: "2.5",
        freshnessScore: "99",
        aiAnalysis: '{"source":"certified"}',
      }),
    );
    assert.equal(created.status, 201);
    const listing = await created.json();
    assert.equal(listing.freshnessScore, 0);
    assert.equal(listing.aiAnalysis, null);
    let readings = await (
      await publicRead(`/api/food-listings/${listing.id}/readings`)
    ).json();
    assert.deepEqual(readings.readings, []);
    assert.equal(readings.stale, true);
    assert.equal(
      (
        await donor("/api/sensor-data", "POST", {
          listingId: listing.id,
          temperature: 4.2,
          humidity: 101,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await donor("/api/sensor-data", "POST", {
          listingId: listing.id,
          temperature: 4.2,
          humidity: 65,
        })
      ).status,
      201,
    );
    readings = await (
      await publicRead(`/api/food-listings/${listing.id}/readings`)
    ).json();
    assert.equal(readings.stale, false);
    assert.equal(readings.unit, "celsius");
    assert.equal(readings.source, "recorded_measurements");
    assert.equal(readings.readings[0].temperature, 4.2);
    assert.equal(readings.readings[0].source, "donor_submitted_measurement");
    assert.equal(readings.readings[0].recordedBy, owner.id);
    assert.equal(
      (
        await recipient(`/api/food-listings/${listing.id}/quality`, "POST", {
          notes: "Spoofed observation",
        })
      ).status,
      403,
    );
    const quality = await donor(
      `/api/food-listings/${listing.id}/quality`,
      "POST",
      {
        notes: "Packaging intact; contains wheat.",
        defects: [],
        source: "certified",
      },
    );
    assert.equal(quality.status, 200);
    assert.equal((await quality.json()).aiAnalysis.source, "donor_observation");
    const inspect = new FormData();
    inspect.set(
      "image",
      new Blob(
        [
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1sAAAAASUVORK5CYII=",
            "base64",
          ),
        ],
        { type: "image/png" },
      ),
      "food.png",
    );
    assert.equal(
      (await donor(`/api/food-listings/${listing.id}/inspect`, "POST", inspect))
        .status,
      503,
    );
    const reserved = await recipient(
      `/api/food-listings/${listing.id}/reservations`,
      "POST",
      {
        contact: "test@example.invalid",
        pickupAt: new Date(Date.now() + 60000).toISOString(),
      },
    );
    assert.equal(reserved.status, 201);
    const claim = await reserved.json();
    assert.equal(
      (await (await publicRead("/api/impact")).json()).completedPickups,
      0,
    );
    await recipient(`/api/reservations/${claim.id}/actions`, "POST", {
      action: "picked_up",
    });
    assert.equal(
      (await (await publicRead("/api/impact")).json()).completedPickups,
      0,
    );
    assert.equal(
      (
        await donor(`/api/reservations/${claim.id}/actions`, "POST", {
          action: "complete",
        })
      ).status,
      200,
    );
    const impact = await (await publicRead("/api/impact")).json();
    assert.equal(impact.completedPickups, 1);
    assert.equal(impact.donorCount, 1);
    assert.equal(impact.reportedWeightKg, 2.5);
    assert.equal(impact.pickupsWithReportedWeight, 1);
    assert.equal(impact.mealsProvided, null);
    assert.equal(
      impact.days.reduce((n, day) => n + day.completedPickups, 0),
      1,
    );
    const suppliers = await (await publicRead("/api/suppliers")).json();
    assert.equal(suppliers.length, 1);
    assert.equal(suppliers[0].supplierName, "data-owner");
    assert.equal(suppliers[0].completedPickups, 1);
    assert.equal(suppliers[0].source, "recorded_activity");
    assert.equal(suppliers[0].overallRating, undefined);
    assert.equal(
      (await (await publicRead(`/api/organizations/${org.id}`)).json())
        .suppliers[0].completedPickups,
      1,
    );
    assert.equal((await publicRead("/api/reservations")).status, 401);
    assert.equal(
      (await (await publicRead(`/api/food-listings/${listing.id}`)).json())
        .aiAnalysis.notes,
      "Packaging intact; contains wheat.",
    );
  } finally {
    await app.close();
  }
});
