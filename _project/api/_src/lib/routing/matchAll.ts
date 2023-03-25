/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { SupportedErrors } from "@effect-app/infra/api/defaultErrorHandler"
import { defaultErrorHandler } from "@effect-app/infra/api/defaultErrorHandler"
import type { Flatten, RouteMatch } from "@effect-app/infra/api/routing"
import { matchAuth } from "./match.js"
import type { RequestEnv, RequestHandler } from "./RequestEnv.js"
import { handleRequestEnv } from "./RequestEnv.js"

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = matchAuth(handlers[cur] as any, defaultErrorHandler, handleRequestEnv)
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

export type SupportedRequestHandler = RequestHandler<any, any, any, any, any, any, any, any, SupportedErrors>

export type RequestHandlers = { [key: string]: SupportedRequestHandler }
export type RequestHandlersTest = {
  [key: string]: Record<string, SupportedRequestHandler>
}

type RouteAll<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends RequestHandler<
    infer R,
    any, // infer PathA,
    any, // infer CookieA,
    any, // infer QueryA,
    any, // infer BodyA,
    any, // infer HeaderA,
    any, // infer ReqA,
    any, // infer ResA,
    SupportedErrors // infer ResE
  > ? RouteMatch<R, never>
    : never
}

export type RouteAllTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAll<T[K]>
}

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
    SupportedErrors // infer ResE
  > ? RouteMatch<R, RequestEnv>
    : never
}

export type RouteAllLoggedInTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAllLoggedIn<T[K]>
}
