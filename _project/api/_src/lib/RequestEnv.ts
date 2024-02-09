/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Role } from "@effect-app-boilerplate/models/User"
import type { AllowAnonymous, RequestConfig } from "@effect-app-boilerplate/resources/lib"
import { HttpServerRequest } from "@effect-app/infra/api/http"
import { JWTError, type RequestHandler } from "@effect-app/infra/api/routing"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { StructFields } from "@effect-app/schema"
import { NotLoggedInError, UnauthorizedError } from "api/errors.js"
import { Auth0Config, checkJWTI } from "api/middleware/auth.js"
import {
  makeUserProfileFromAuthorizationHeader,
  makeUserProfileFromUserHeader,
  UserProfile
} from "../services/UserProfile.js"

export interface CTX {
  context: RequestContext
}

export type GetCTX<Req> =
  & CTX
  & (AllowAnonymous<Req> extends true ? {
      userProfile?: UserProfile
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    : { userProfile: UserProfile })

export type GetContext<Req> = AllowAnonymous<Req> extends true ? never
  // eslint-disable-next-line @typescript-eslint/ban-types
  : UserProfile

export const RequestCacheLayers = Layer.mergeAll(
  Layer.setRequestCache(
    EffectRequest.makeCache({ capacity: 500, timeToLive: Duration.hours(8) })
  ),
  Layer.setRequestCaching(true),
  Layer.setRequestBatching(true)
)

const authConfig = Auth0Config.runSync
const EmptyLayer = Effect.unit.toLayerDiscard
const fakeLogin = true

const checkRoles = (request: any, userProfile: Option<UserProfile>) =>
  Effect.gen(function*($) {
    const userRoles = userProfile
      .map((_) => _.roles.includes("manager") ? [Role("manager"), Role("user")] : [Role("user")])
      .getOrElse(() => [Role("user")])
    const allowedRoles: readonly Role[] = request.allowedRoles ?? ["user"]
    if (!allowedRoles.some((_) => userRoles.includes(_))) {
      return yield* $(new UnauthorizedError())
    }
  })

const UserAuthorizationLive = <Req extends RequestConfig>(request: Req) =>
  Effect
    .gen(function*($) {
      if (!fakeLogin && !request.allowAnonymous) {
        yield* $(checkJWTI(authConfig).catchAll((err) => Effect.fail(new JWTError({ error: err }))))
      }
      const req = yield* $(HttpServerRequest)
      const r = (fakeLogin
        ? makeUserProfileFromUserHeader(req.headers["x-user"])
        : makeUserProfileFromAuthorizationHeader(
          req.headers["authorization"]
        ))
        .exit
        .runSync
      if (!r.isSuccess()) {
        yield* $(Effect.logWarning("Parsing userInfo failed").annotateLogs("r", r))
      }
      const userProfile = Option.fromNullable(r.isSuccess() ? r.value : undefined)

      const rcc = yield* $(RequestContextContainer)
      yield* $(rcc.update((_): RequestContext => ({ ..._, userProfile: userProfile.value })))

      const up = userProfile.value
      if (!request.allowAnonymous && !up) {
        return yield* $(new NotLoggedInError())
      }

      yield* $(checkRoles(request, userProfile))

      if (up) {
        return Layer.succeed(UserProfile, up)
      }
      return EmptyLayer
    })
    .withSpan("middleware")
    .unwrapLayer

export const RequestEnv = <Req extends RequestConfig>(handler: { Request: Req }) =>
  Layer.mergeAll(UserAuthorizationLive(handler.Request))

export type RequestEnv = Layer.Success<ReturnType<typeof RequestEnv>>

export function handleRequestEnv<
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
            userProfile: Effect.serviceOption(UserProfile).map((_) => _.getOrUndefined)
          })
          .flatMap((ctx) => (handler.h as (i: any, ctx: CTX) => Effect<ResA, ResE, R>)(pars, ctx as any /* TODO */))
          .provide(RequestCacheLayers)
    },
    makeRequestLayer: RequestEnv(handler)
  }
}
