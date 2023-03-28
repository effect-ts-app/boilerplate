/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import * as Ex from "@effect-app/infra-adapters/express"
import type { RequestHandler as RequestHandlerOrig } from "@effect-app/infra/api/express/schema/requestHandler"
import { makeRouteDescriptor } from "@effect-app/infra/api/express/schema/routing"
import type { Middleware } from "@effect-app/infra/api/routing"
import type { ValidationError } from "@effect-app/infra/errors"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
// import { AUTH_DISABLED } from "api/config.js"
import { makeUserProfileFromUserHeader } from "api/services.js"

import type express from "express"
import { makeRequestHandler } from "./makeRequestHandler.js"

export function matchAuth<
  R,
  E,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  R2 = never,
  PR = never,
  RErr = never
>(
  requestHandler: RequestHandlerOrig<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    E
  >,
  errorHandler: <R>(
    req: express.Request,
    res: express.Response,
    r2: Effect<R, E | ValidationError, void>
  ) => Effect<RErr, never, void>,
  middleware?: Middleware<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    E,
    R2,
    PR
  >
) {
  let makeMiddlewareContext = undefined
  if (middleware) {
    const { handler, makeContext } = middleware(requestHandler)
    requestHandler = handler
    makeMiddlewareContext = makeContext
  }
  const match = Ex.match(requestHandler.Request.method.toLowerCase() as any)
  const handler = makeRequestHandler<R, E, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR, RErr>(
    requestHandler,
    errorHandler,
    makeMiddlewareContext,
    req =>
      RequestContextContainer.flatMap(_ => {
        const r = makeUserProfileFromUserHeader(req.headers["x-user"]).exit.runSync$
        // const r = (!AUTH_DISABLED
        //   ? makeUserProfileFromAuthorizationHeader(req.headers["authorization"])
        //   : makeUserProfileFromUserHeader(req.headers["x-user"])).exit.runSync$
        return _.update(_ => ({ ..._, user: r.isSuccess() ? r.value : undefined }))
      })
  )
  const path = requestHandler.Request.path.split("?")[0]
  return (
    // // TODO: when anonymous, and there is a jwt, still check if it's valid
    // (requestHandler.Request as any).allowAnonymous
    // ?
    match(path, handler)
    // : match(path, checkJwt(Auth0Config.config.runSync$), handler)
  )
    .zipRight(
      Effect(
        makeRouteDescriptor(
          requestHandler.Request.path,
          requestHandler.Request.method,
          requestHandler
        )
      )
    )
}
