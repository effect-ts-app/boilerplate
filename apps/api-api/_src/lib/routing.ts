import type {
  Flatten,
  RequestHandlers,
  RequestHandlersTest,
  RouteMatch
} from "@effect-ts-app/boilerplate-infra/lib/api/routing"
import { match } from "@effect-ts-app/boilerplate-infra/lib/api/routing"
import type { RequestHandler } from "@effect-ts-app/infra/express/schema/requestHandler"
import type { UserProfile } from "../services.js"
import { handleLogin } from "./authorization.js"

export * from "@effect-ts-app/boilerplate-infra/lib/api/routing"
export * from "./authorization.js"

type RouteAllLoggedIn<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends RequestHandler<
    infer R,
    any, // infer PathA,
    any, // infer CookieA,
    any, // infer QueryA,
    any, // infer BodyA,
    any, // infer HeaderA,
    any, // infer ReqA,
    any, // infer ResA,
    any // infer ResE
  > ? RouteMatch<
    R,
    /*PathA, CookieA,QueryA, BodyA, */ /*HeaderA, ReqA, ResA,*/ never, // Has<Config>,
    UserProfile // & LoggedInUserContext /*, R2, PR*/
  >
    : never
}

export type RouteAllLoggedInTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAllLoggedIn<T[K]>
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = match(handlers[cur] as any, handleLogin)
    return prev
  }, {} as any) as RouteAllLoggedIn<typeof handlers>

  return mapped
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAllAlt<T extends RequestHandlersTest>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    const matches = matchAll(handlers[cur])
    matches.$$.keys.forEach(key => prev[`${cur as string}.${key as string}`] = matches[key])
    return prev
  }, {} as any) as Flatten<RouteAllLoggedInTest<typeof handlers>>

  return mapped
}
