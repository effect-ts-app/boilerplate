import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"

async function globalSetup(_config: FullConfig) {
  if (process.env["SKIP_LOGIN"]) {
    return
  }
  // const baseUrl = process.env["CYPRESS_BASE_URL"] ?? "http://localhost:4000"
  const browser = await chromium.launch()
  try {
    // Login with storageState
  } finally {
    await browser.close()
  }
}

export default globalSetup
