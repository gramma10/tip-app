import { expect, test, type Page } from "@playwright/test";

async function tip(page: Page, { amount, stars }: { amount: string; stars: string }) {
  await page.getByRole("radio", { name: amount, exact: true }).click();
  await page.getByRole("radio", { name: stars }).click();
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/\/thanks\?/);
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();
}

const PRIVATE_CONFIRMATION = "Your feedback has been sent privately to the venue manager";

test("5 stars: the guest is offered a Google review", async ({ page }) => {
  await page.goto("/t/maria");
  await expect(page.getByRole("heading", { name: "Maria" })).toBeVisible();
  await tip(page, { amount: "€3", stars: "Excellent" });

  await expect(page.getByText("Maria received your €3.00 tip")).toBeVisible();
  await expect(page.getByRole("link", { name: "Review on Google" })).toBeVisible();
  await expect(page.getByText(PRIVATE_CONFIRMATION)).toHaveCount(0);
});

test("4 stars: no Google review CTA and no private-feedback confirmation", async ({ page }) => {
  await page.goto("/t/eleni");
  await tip(page, { amount: "€3", stars: "Great" });

  await expect(page.getByRole("link", { name: "Review on Google" })).toHaveCount(0);
  await expect(page.getByText(PRIVATE_CONFIRMATION)).toHaveCount(0);
});

for (const stars of ["Poor", "Fair", "Okay"]) {
  test(`${stars} (1–3 stars): only the private-feedback confirmation, no Google CTA`, async ({ page }) => {
    await page.goto("/t/giorgos");
    await tip(page, { amount: "€2", stars });

    await expect(page.getByText(PRIVATE_CONFIRMATION)).toBeVisible();
    await expect(page.getByRole("link", { name: "Review on Google" })).toHaveCount(0);
  });
}

test("rating given on the thank-you screen also decides the Google CTA", async ({ page }) => {
  await page.goto("/t/nikos");
  await page.getByRole("radio", { name: "€2", exact: true }).click();
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/\/thanks\?/);
  await expect(page.getByRole("link", { name: "Review on Google" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Excellent" }).click();
  await expect(page.getByRole("link", { name: "Review on Google" })).toBeVisible();
});

test("fee cover is on by default and can be switched off", async ({ page }) => {
  await page.goto("/t/eleni");
  await page.getByRole("radio", { name: "€5", exact: true }).click();
  const toggle = page.getByRole("switch");
  await expect(toggle).toBeChecked();
  // €5 tip + €0.55 cover so Eleni receives the full €5.00.
  await expect(page.getByRole("button", { name: "Pay €5.55" })).toBeVisible();
  await toggle.uncheck();
  await expect(page.getByRole("button", { name: "Pay €5.00" })).toBeVisible();
});

test("table card lets the guest choose who served them", async ({ page }) => {
  await page.goto("/t/table-7");
  await expect(page.getByRole("heading", { name: "Who served you?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dimitris/ })).toHaveCount(0); // not payable yet
  await page.getByRole("button", { name: /Nikos/ }).click();
  await expect(page.getByRole("heading", { name: "Nikos" })).toBeVisible();
  await tip(page, { amount: "€5", stars: "Great" });
});

test("custom amount keypad", async ({ page }) => {
  await page.goto("/t/sofia");
  await page.getByRole("radio", { name: "Other" }).click();
  for (const key of ["7", ".", "5"]) await page.getByRole("button", { name: key, exact: true }).click();
  await page.getByRole("button", { name: "Use €7.50" }).click();
  // Fee cover is on by default: €7.50 tip + €0.70 cover.
  await expect(page.getByText("Sofia receives the full €7.50")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay €8.20" })).toBeVisible();
});

test("unknown and unassigned cards explain themselves", async ({ page }) => {
  const res = await page.goto("/t/not-a-card");
  expect(res?.status()).toBe(404);
  await page.goto("/t/dimitris");
  await expect(page.getByRole("heading", { name: "Tips aren't switched on yet" })).toBeVisible();
});

test("guest page is served in Greek to Greek phones", async ({ browser }) => {
  const ctx = await browser.newContext({ locale: "el-GR", extraHTTPHeaders: { "accept-language": "el-GR,el;q=0.9" } });
  const page = await ctx.newPage();
  await page.goto("/t/maria");
  await expect(page.getByText("Αφήστε φιλοδώρημα")).toBeVisible();
  await expect(page.getByRole("radio", { name: "2 €", exact: true })).toBeVisible();
  await ctx.close();
});
