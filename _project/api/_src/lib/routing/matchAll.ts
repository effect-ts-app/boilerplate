/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import type { SupportedErrors } from "@effect-app/prelude/client"
import type { Flatten, RouteMatch } from "./base.js"
import type { GetContext } from "./ctx.js"
import { defaultErrorHandler } from "./defaultErrorHandler.js"
import { match } from "./match.js"
import type { RequestEnv, RequestHandler } from "./RequestEnv.js"
import { handleRequestEnv } from "./RequestEnv.js"

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = match(handlers[cur]!, defaultErrorHandler, handleRequestEnv)
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
    matches.$$.keys.forEach((key) => prev[`${cur as string}.${key as string}`] = matches[key])
    return prev
  }, {} as any) as Flatten<RouteAllLoggedInTest<typeof handlers>>

  return mapped
}

export type SupportedRequestHandler = RequestHandler<any, any, any, any, any, any, any, any, any, SupportedErrors, any>

export type RequestHandlers = { [key: string]: SupportedRequestHandler }
export type RequestHandlersTest = {
  [key: string]: Record<string, SupportedRequestHandler>
}

type RouteAllLoggedIn<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends RequestHandler<
    infer R,
    infer M,
    any, // infer PathA,
    any, // infer CookieA,
    any, // infer QueryA,
    any, // infer BodyA,
    any, // infer HeaderA,
    any, // infer ReqA,
    any, // infer ResA,
    SupportedErrors, // infer ResE,
    any
  > ? RouteMatch<R, M, RequestEnv | GetContext<T[K]["Request"]>>
    : never
}

export type RouteAllLoggedInTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAllLoggedIn<T[K]>
}
