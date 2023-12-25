/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { type RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"
import type { ValidationError } from "@effect-app/infra/errors"
import type { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import type { StructFields } from "@effect-app/prelude/schema"
import { HttpRouter, type HttpServerRequest, type HttpServerResponse } from "../http.js"
import { makeRequestHandler } from "./makeRequestHandler.js"
import type { Middleware } from "./makeRequestHandler.js"
import type { RequestHandler } from "./RequestEnv.js"

export const RouteDescriptors = Tag<Ref<RouteDescriptorAny[]>>()

export function match<
  R,
  M,
  PathA extends StructFields,
  CookieA extends StructFields,
  QueryA extends StructFields,
  BodyA extends StructFields,
  HeaderA extends StructFields,
  ReqA extends PathA & QueryA & BodyA,
  ResA extends StructFields,
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
  ) => Effect<RErr | R | RequestContextContainer | ContextMapContainer, never, HttpServerResponse>,
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
  let middlewareLayer: Layer<R2, MiddlewareE, PR> | undefined = undefined
  if (middleware) {
    const { handler, makeRequestLayer } = middleware(requestHandler)
    requestHandler = handler as any // todo
    middlewareLayer = makeRequestLayer
  }
  return Effect.gen(function*() {
    // const rdesc = yield* $(RouteDescriptors.flatMap((_) => _.get))

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
      middlewareLayer
    )

    const route = HttpRouter.makeRoute(
      requestHandler.Request.method,
      requestHandler.Request.path,
      handler
    )
    // TODO
    // rdesc.push(makeRouteDescriptor(
    //   requestHandler.Request.path,
    //   requestHandler.Request.method,
    //   requestHandler
    // ))
    return route
  })
}
