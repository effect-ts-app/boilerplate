/* eslint-disable @typescript-eslint/no-explicit-any */
import { JWTError, type RequestHandler } from "@effect-app/infra/api/routing"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { Struct } from "@effect/schema/Schema"
import { NotLoggedInError, UnauthorizedError } from "api/errors.js"
import { Auth0Config, checkJWTI } from "api/middleware/auth.js"
import { Duration, Effect, Exit, Layer, Option, Request } from "effect-app"
import { HttpServerRequest } from "effect-app/http"
import { Role } from "models/User.js"
import type { RequestConfig } from "resources/lib.js"
import {
  makeUserProfileFromAuthorizationHeader,
  makeUserProfileFromUserHeader,
  UserProfile
} from "../services/UserProfile.js"
import { basicRuntime } from "./basicRuntime.js"

export interface CTX {
  context: RequestContext
}

export const RequestCacheLayers = Layer.mergeAll(
  Layer.setRequestCache(
    Request.makeCache({ capacity: 500, timeToLive: Duration.hours(8) })
  ),
  Layer.setRequestCaching(true),
  Layer.setRequestBatching(true)
)

const authConfig = basicRuntime.runSync(Auth0Config)
const fakeLogin = true

const checkRoles = (request: any, userProfile: Option<UserProfile>) =>
  Effect.gen(function*() {
    const userRoles = Option
      .map(userProfile, (_) => _.roles.includes("manager") ? [Role("manager"), Role("user")] : [Role("user")])
      .pipe(Option.getOrElse(() => [Role("user")]))
    const allowedRoles: readonly Role[] = request.allowedRoles ?? ["user"]
    if (!allowedRoles.some((_) => userRoles.includes(_))) {
      return yield* new UnauthorizedError()
    }
  })

const UserAuthorizationLive = <Req extends RequestConfig>(request: Req) =>
  Effect
    .gen(function*() {
      if (!fakeLogin && !request.allowAnonymous) {
        yield* Effect.catchAll(checkJWTI(authConfig), (err) => Effect.fail(new JWTError({ error: err })))
      }
      const req = yield* HttpServerRequest.HttpServerRequest
      const r = (fakeLogin
        ? makeUserProfileFromUserHeader(req.headers["x-user"])
        : makeUserProfileFromAuthorizationHeader(
          req.headers["authorization"]
        ))
        .pipe(Effect.exit, basicRuntime.runSync)
      if (!Exit.isSuccess(r)) {
        yield* Effect.logWarning("Parsing userInfo failed").pipe(Effect.annotateLogs("r", r))
      }
      const userProfile = Option.fromNullable(Exit.isSuccess(r) ? r.value : undefined)

      const rcc = yield* RequestContextContainer
      const up = Option.getOrUndefined(userProfile)
      yield* rcc.update((_): RequestContext => ({ ..._, userProfile: up }))

      if (!request.allowAnonymous && !up) {
        return yield* new NotLoggedInError()
      }

      yield* checkRoles(request, userProfile)

      if (up) {
        return Layer.succeed(UserProfile, up)
      }
      return Layer.empty
    })
    .pipe(Effect.withSpan("middleware"), Layer.unwrapEffect)

export const RequestEnv = <Req extends RequestConfig>(handler: { Request: Req }) =>
  Layer.mergeAll(UserAuthorizationLive(handler.Request))

export type RequestEnv = Layer.Layer.Success<ReturnType<typeof RequestEnv>>

export function handleRequestEnv<
  R,
  M,
  PathA extends Struct.Fields,
  CookieA extends Struct.Fields,
  QueryA extends Struct.Fields,
  BodyA extends Struct.Fields,
  HeaderA extends Struct.Fields,
  ReqA extends PathA & QueryA & BodyA,
  ResA extends Struct.Fields,
  ResE,
  PPath extends `/${string}`,
  CTX,
  Context
>(
  handler: RequestHandler<
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
    PPath,
    CTX,
    Context,
    RequestConfig
  >
) {
  return {
    handler: {
      ...handler,
      h: (pars: any) =>
        Effect
          .all({
            context: RequestContextContainer.get,
            userProfile: Effect.andThen(Effect.serviceOption(UserProfile), Option.getOrUndefined)
          })
          .pipe(
            Effect.andThen((ctx) =>
              (handler.h as (i: any, ctx: CTX) => Effect<ResA, ResE, R>)(pars, ctx as any /* TODO */)
            ),
            Effect.provide(RequestCacheLayers)
          )
    },
    makeRequestLayer: RequestEnv(handler)
  }
}
