/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { makeRouteDescriptor, type RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"

import type { ValidationError } from "@effect-app/infra/errors"
import { HttpRouter, type HttpServerRequest, type HttpServerResponse } from "../http.js"
import { makeRequestHandler } from "./makeRequestHandler.js"
import type { MakeMiddlewareContext, Middleware } from "./makeRequestHandler.js"
import type { RequestHandler } from "./RequestEnv.js"

export const RouteDescriptors = Tag<Ref<RouteDescriptorAny[]>>()

export function match<
  R,
  M,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE,
  MiddlewareE,
  PPath extends `/${string}`,
  R2 = never,
  PR = never,
  RErr = never
>(
  requestHandler: RequestHandler<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    PPath
  >,
  errorHandler: <R>(
    req: HttpServerRequest,
    res: HttpServerResponse,
    r2: Effect<R, ValidationError | MiddlewareE | ResE, HttpServerResponse>
  ) => Effect<RErr | R, never, HttpServerResponse>,
  middleware?: Middleware<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    MiddlewareE,
    PPath,
    R2,
    PR
  >
) {
  let makeMiddlewareContext: MakeMiddlewareContext<MiddlewareE, R2, PR> | undefined = undefined
  if (middleware) {
    const { handler, makeContext } = middleware(requestHandler)
    requestHandler = handler as any // todo
    makeMiddlewareContext = makeContext
  }
  return Effect.gen(function*($) {
    const rdesc = yield* $(RouteDescriptors.flatMap((_) => _.get))

    const handler = makeRequestHandler<
      R,
      M,
      PathA,
      CookieA,
      QueryA,
      BodyA,
      HeaderA,
      ReqA,
      ResA,
      ResE,
      MiddlewareE,
      R2,
      PR,
      RErr,
      PPath
    >(
      requestHandler as any, // one argument if no middleware, 2 if has middleware. TODO: clean this shit up
      errorHandler,
      makeMiddlewareContext
    )

    const route = HttpRouter.makeRoute(
      requestHandler.Request.method,
      requestHandler.Request.path,
      handler
    )

    rdesc.push(makeRouteDescriptor(
      requestHandler.Request.path,
      requestHandler.Request.method,
      requestHandler
    ))
    return route
  })
}
