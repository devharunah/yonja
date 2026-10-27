import { expect, test } from "@playwright/test";

for (const path of ["/", "/report", "/coach", "/dashboard"]) {
  test(`${path} renders`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
