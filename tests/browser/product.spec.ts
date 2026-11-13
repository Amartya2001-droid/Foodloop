import { test, expect, type Page } from "@playwright/test";
async function account(page: Page, username: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "New here? Create account" }).click();
  await page
    .getByRole("textbox", { name: "Username", exact: true })
    .fill(username);
  await page
    .getByLabel("Password", { exact: true })
    .fill("local-browser-test-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
}
test("two people donate, measure, reserve and confirm a real pickup", async ({
  browser,
}, testInfo) => {
  const donorContext = await browser.newContext(),
    recipientContext = await browser.newContext();
  const donor = await donorContext.newPage(),
    recipient = await recipientContext.newPage();
  const errors: string[] = [];
  donor.on("pageerror", (error) => errors.push(error.message));
  recipient.on("pageerror", (error) => errors.push(error.message));
  await account(donor, "browser-donor");
  await donor.getByRole("button", { name: "Post surplus food" }).click();
  const dialog = donor.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill("Community bread");
  await dialog
    .getByLabel("Description & allergens")
    .fill("Fresh bread, contains wheat.");
  await dialog.getByLabel("Quantity", { exact: true }).fill("2 loaves");
  await dialog.getByLabel("Weight (kg, optional)").fill("1.2");
  await dialog
    .getByLabel("Pickup address or landmark")
    .fill("Community hall entrance");
  await dialog.getByLabel("Latitude", { exact: true }).fill("44.65");
  await dialog.getByLabel("Longitude", { exact: true }).fill("-63.58");
  await dialog
    .getByRole("button", { name: "Post donation", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await donor.getByRole("link", { name: "Details & measurements" }).click();
  await expect(donor.getByText("No measurements recorded.")).toBeVisible();
  await donor.getByLabel("Temperature (°C)", { exact: true }).fill("4");
  await donor.getByLabel("Humidity (%)").fill("65");
  await donor.getByRole("button", { name: "Record measurement" }).click();
  await expect(donor.getByText("4 °C · 65% RH")).toBeVisible();
  await donor
    .getByLabel("What did you observe?")
    .fill("Packaging intact. Contains wheat.");
  await donor.getByRole("button", { name: "Save observation" }).click();
  await expect(
    donor.getByText("Packaging intact. Contains wheat.", { exact: true }),
  ).toBeVisible();
  await account(recipient, "browser-recipient");
  await recipient.getByRole("button", { name: "Reserve", exact: true }).click();
  const reservation = recipient.getByRole("dialog");
  const future = new Date(Date.now() + 3600000);
  const local = new Date(future.getTime() - future.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  await reservation.getByLabel("Pickup time", { exact: true }).fill(local);
  await reservation
    .getByLabel("Contact email or phone")
    .fill("browser@example.invalid");
  await reservation
    .getByRole("button", { name: "Reserve food", exact: true })
    .click();
  await expect(reservation).not.toBeVisible();
  await recipient.getByRole("link", { name: "Pickups", exact: true }).click();
  await recipient.getByRole("button", { name: "I picked it up" }).click();
  await expect(
    recipient.getByRole("heading", { name: "Community bread · picked up" }),
  ).toBeVisible();
  await donor.getByRole("link", { name: "Pickups", exact: true }).click();
  await donor.getByRole("button", { name: "Confirm completed pickup" }).click();
  await expect(
    donor.getByRole("heading", { name: "Community bread · completed" }),
  ).toBeVisible();
  await donor.getByRole("link", { name: "Impact", exact: true }).click();
  await expect(
    donor
      .getByRole("article")
      .filter({
        has: donor.getByRole("heading", {
          name: "Confirmed pickups",
          exact: true,
        }),
      }),
  ).toContainText("1");
  await expect(
    donor.getByText("Meals and CO₂ savings are not measured", { exact: false }),
  ).toBeVisible();
  await expect(donor.getByText("browser-donor", { exact: true })).toBeVisible();
  await donor.screenshot({
    path: testInfo.outputPath("desktop-impact.png"),
    fullPage: true,
  });
  await donor.setViewportSize({ width: 390, height: 844 });
  await donor.goto("/");
  expect(
    await donor.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await donor.screenshot({
    path: testInfo.outputPath("mobile-browse.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await donorContext.close();
  await recipientContext.close();
});

test("failed data source shows unavailable state without invented totals", async ({
  page,
}) => {
  await page.route("**/api/impact", (route) => route.abort());
  await page.goto("/impact");
  await expect(
    page.getByText("Could not load impact.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Confirmed pickups", exact: true }),
  ).toHaveCount(0);
});
