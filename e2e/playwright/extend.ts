import "playwright-core"

import type { Page } from "@playwright/test"

import { HashMap, Opt } from "@/prelude.js"
import type { TestSelector } from "../helpers/@types/enhanced-selectors.js"
import type { SupportedEnv } from "../helpers/shared.js"
import { makeEnv, toBase64 } from "../helpers/shared.js"
import type { LocatorAble } from "./types.js"
import { locateTest_ } from "./util.js"

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
    const cookieHeader = [
      "Cookie",
      cookies.map(c => `${c.name}=${c.value}`).join("; ")
    ] as const
    const user = env("BASIC_AUTH_USER")
    const pass = env("BASIC_AUTH_PASSWORD")
    const { runtime } = makeEnv(
      {
        apiUrl: `${env("BASE_URL") ?? "http://localhost:4000"}/api`,
        headers: {
          ...(user && pass
            ? Opt.some(HashMap.make(
              cookieHeader,
              [
                "Authorization",
                toBase64(`${user}:${pass}`)
              ]
            ))
            : Opt.some(HashMap.make(cookieHeader)))
        }
      },
      { AUTH_DISABLED: process.env["AUTH_DISABLED"] === "true" }
    )

    return await self["|>"](runtime.runPromise)
  }
})

function env(v: string) {
  return process.env["CYPRESS_" + v]
}
