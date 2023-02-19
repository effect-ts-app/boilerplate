import { expect, test } from "@playwright/test"

test("Can visit the page", async ({ page }) => {
  await page.goto(`/`)
  // await expect(page.click("text=@effect-app/boilerplate")).toBeVisible()
  await expect(page.locator("text=randomUser")).toBeVisible()
  // await page.click("text=@effect-app/boilerplate")
})
