import type { Locator } from "@playwright/test"

export interface LocatorAble {
  locator(selector: string): Locator
}
