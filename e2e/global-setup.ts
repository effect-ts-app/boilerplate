import type { Browser, FullConfig } from "@playwright/test"
import { chromium, expect } from "@playwright/test"

async function globalSetup(_config: FullConfig) {
  if (process.env["SKIP_LOGIN"]) {
    return
  }
  const baseUrl = process.env["BASE_URL"] ?? "http://localhost:4000"
  const browser = await chromium.launch()
  const l = login(baseUrl, browser)
  try {
    // Login with storageState
    // await l("Someone", "storageState.manager.json")
    await l("Someone Else", "storageState.user.json")
  } finally {
    await browser.close()
  }
}

function login(baseUrl: string, browser: Browser) {
  return async (name: string, storageStatePath: string) => {
    const page = await browser.newPage()
    const basicAuthCredentials = process.env["BASIC_AUTH_CREDENTIALS"]
    if (basicAuthCredentials) {
      await page.context().setExtraHTTPHeaders(
        {
          "authorization": `Basic ${Buffer.from(basicAuthCredentials).toString("base64")}`
        }
      )
    }
    await page.goto(baseUrl + "/login")
    await page.click(`text=${name}`)
    await page.waitForURL(u => {
      const url = u.toString()
      return url === baseUrl + "/"
    })
    await expect(page.getByText(name)).toBeVisible()
    await page.context().storageState({ path: storageStatePath })
  }
}

export default globalSetup
