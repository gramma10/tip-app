import { expect, test } from "@playwright/test";

test("owner reassigns a card and the same QR link now tips the new person", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as the owner" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  await page.goto("/dashboard/cards");
  await page.getByRole("button", { name: /Spare card/ }).click();
  await page.getByRole("radio", { name: "Sofia" }).click();
  await expect(page.getByText("Card assigned to Sofia")).toBeVisible();

  await page.goto("/t/spare-1");
  await expect(page.getByRole("heading", { name: "Sofia" })).toBeVisible();

  // Put it back so reruns start from the same state.
  await page.goto("/dashboard/cards");
  await page.getByRole("button", { name: /Spare card/ }).click();
  await page.getByRole("radio", { name: "Not assigned" }).click();
  await expect(page.getByText("Card unassigned")).toBeVisible();
});

test("owner invites a team member who joins and sees their card", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as the owner" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/dashboard/staff");
  await page.getByRole("button", { name: "Invite" }).first().click();
  await page.getByLabel("Name").fill("Petros");
  await page.getByLabel("Role").fill("Bar");
  await page.getByRole("button", { name: "Create invite link" }).click();
  const link = (await page.getByText(/\/join\//).textContent())!.trim();

  await context.clearCookies();
  await page.goto(new URL(link).pathname);
  await page.getByRole("button", { name: "Accept invite" }).click();
  await page.waitForURL("**/me");
  await expect(page.getByRole("heading", { name: "Petros" })).toBeVisible();
  await expect(page.getByText("Your tips are paused until you set up payouts.")).toBeVisible();

  // Demo payouts onboarding completes immediately.
  await page.goto("/me/profile");
  await page.getByRole("link", { name: "Set up payouts" }).click();
  await expect(page.getByText("Ready to receive tips")).toBeVisible();

  await page.goto("/me/card");
  await expect(page.getByText("Scan to tip Petros")).toBeVisible();
});

test("staff home shows a tip that just arrived", async ({ page, context }) => {
  await page.goto("/t/nikos");
  await page.getByRole("radio", { name: "€5", exact: true }).click();
  await page.getByRole("radio", { name: "Excellent" }).click();
  await page.getByRole("textbox").fill("Best freddo on the island");
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/\/thanks\?/);

  await context.clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Nikos" }).click();
  await page.waitForURL("**/me");
  await expect(page.getByText("Best freddo on the island").first()).toBeVisible();
});

test("staff uploads a photo and it appears on their tip page", async ({ page }) => {
  // A 4×4 PNG: enough for the browser to decode, crop and sample.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGM4oWEDRwzEcQDwgxLBOV5x7gAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Dimitris" }).click();
  await page.waitForURL("**/me");
  await page.goto("/me/profile");
  await page.locator('input[type="file"]').setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Saved")).toBeVisible();
  await expect(page.getByRole("img", { name: "Dimitris" }).first()).toBeVisible();

  await page.goto("/t/dimitris");
  await expect(page.getByRole("img", { name: "Dimitris" }).first()).toBeVisible();
});

test("staff can't open the owner dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Maria" }).click();
  await page.waitForURL("**/me");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/me$/);
});
