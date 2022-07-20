import "playwright-core"

import type { Effect } from "@effect-ts-app/boilerplate-prelude"
import type { Page } from "@playwright/test"

import type { TestSelector } from "../cypress/support/@types/enhanced-selectors"
import type { SupportedEnv } from "../helpers/shared"
import { makeEnv, toBase64 } from "../helpers/shared"
import type { LocatorAble } from "./types"
import { locateTest_ } from "./util"

declare module "playwright-core" {
  export interface Page {
    locateTest(this: Page, selector: TestSelector): Locator

    runPromise<E, A>(this: Page, self: Effect<SupportedEnv, E, A>): Promise<A>
  }

  export interface Locator {
    locateTest(this: Locator, selector: TestSelector): Locator
  }
}

// we're extending Object instead of Page, because we can't reach the Page object.
Object.defineProperty(Object.prototype, "locateTest", {
  value(this: LocatorAble, sel: TestSelector) {
    return locateTest_(this, sel)
  },
  enumerable: false,
  writable: true
})

// TODO: the downside is that this is not "bound", so you can't pass the function around in pipes etc.
Object.defineProperty(Object.prototype, "runPromise", {
  async value<E, A>(this: Page, self: Effect<SupportedEnv, E, A>) {
    // TODO; proper
    // TODO: we probably only need to create the ENV once per page object..
    const cookies = await this.context().cookies()
    const headers = {
      Cookie: cookies.map(c => `${c.name}=${c.value}`).join("; ")
    }
    const user = env("BASIC_AUTH_USER")
    const pass = env("BASIC_AUTH_PASSWORD")
    const { runPromise } = makeEnv(
      {
        apiUrl: `${env("BASE_URL") ?? "http://localhost:4000"}/api/proxy`,
        headers: {
          ...(user && pass
            ? {
              Authorization: toBase64(`${user}:${pass}`),
              ...headers
            }
            : headers)
        }
      },
      { AUTH_DISABLED: process.env["AUTH_DISABLED"] === "true" }
    )

    return await self["|>"](runPromise)
  }
})

function env(v: string) {
  return process.env["CYPRESS_" + v]
}
