import type { TestSelector } from "../helpers/@types/enhanced-selectors.js"
import type { LocatorAble } from "./types.js"

export function enhancePageWithLocateTest(page: LocatorAble) {
  return (sel: TestSelector) => locateTest_(page, sel)
}

export function locateTest(sel: TestSelector) {
  return (page: LocatorAble) => locateTest_(page, sel)
}

export function locateTest_(page: LocatorAble, sel: TestSelector) {
  const [testId, ...rest] = sel.split(" ")
  if (testId.includes(":")) {
    const [testId2, ...rest2] = testId.split(":")
    const testSelector = `[data-test='${testId2}']:${rest2.join(":")}`
    return page.locator(
      rest.length ? testSelector + ` ${rest.join(" ")}` : testSelector
    )
  }
  const testSelector = `[data-test='${testId}']`
  return page.locator(rest.length ? testSelector + ` ${rest.join(" ")}` : testSelector)
}
