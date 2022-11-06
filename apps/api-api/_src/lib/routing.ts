import { NotLoggedInError } from "@effect-ts-app/boilerplate-infra/errors"
import type { SupportedErrors } from "@effect-ts-app/boilerplate-infra/lib/api/defaultErrorHandler"
import { defaultErrorHandler } from "@effect-ts-app/boilerplate-infra/lib/api/defaultErrorHandler"
import type { Flatten, RouteMatch } from "@effect-ts-app/boilerplate-infra/lib/api/routing"
import { match } from "@effect-ts-app/boilerplate-infra/lib/api/routing"
import type { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext"
import { RequestLayers } from "@effect-ts-app/boilerplate-messages/RequestLayers"
import type { RequestHandler } from "@effect-ts-app/infra/express/schema/requestHandler"
import type express from "express"
import { CurrentUser, UserRepository } from "../services.js"
import { makeUserProfileFromUserHeader, UserProfile } from "../services/UserProfile.js"

function RequestLayer(handler: { Request: any }) {
  return (req: express.Request, _res: express.Response, requestContext: RequestContext) => {
    return RequestLayers(requestContext)
      > Layer.fromEffect(UserProfile)(
        Effect.suspendSucceed(() => {
          const p = makeUserProfileFromUserHeader(req.headers["x-user"])
            .map(Maybe.some)
          const r = handler.Request.allowAnonymous
            ? p.catchAll(() => Effect(Maybe.none))
            : p.mapError(() => new NotLoggedInError())
          return r
        })
          .map(_ => UserProfile.make({ get: _.encaseInEffect(() => new NotLoggedInError()) }))
      )
      > Layer.fromEffect(CurrentUser)(
        Effect.serviceWithEffect(UserRepository, _ => _.getCurrentUser)
          .map(Maybe.some)
          .catchAll(() => Effect(Maybe.none))
          .map(_ => CurrentUser.make({ get: _.encaseInEffect(() => new NotLoggedInError()) }))
      )
  }
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = match(handlers[cur] as any, defaultErrorHandler, handleRequestLayer)
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

type LayerA<X> = X extends Layer<any, any, infer A> ? A : never
export type RequestLayer = LayerA<ReturnType<ReturnType<typeof RequestLayer>>>

function handleRequestLayer<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE
>(
  handler: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, ResE>
) {
  return {
    handler,
    handle: RequestLayer(handler)
  }
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
  > ? RouteMatch<R, RequestLayer>
    : never
}

export type RouteAllLoggedInTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAllLoggedIn<T[K]>
}

export * from "@effect-ts-app/boilerplate-infra/lib/api/routing"
