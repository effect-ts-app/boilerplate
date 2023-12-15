/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Role } from "@effect-app-boilerplate/models/User"
import type { RequestConfig } from "@effect-app-boilerplate/resources/lib"
import type { Request } from "@effect-app/infra/api/express/schema/routing"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { ReqRes, ReqResSchemed } from "@effect-app/prelude/schema"
import { NotLoggedInError, UnauthorizedError } from "api/errors.js"
import { Auth0Config, checkJWTI } from "api/middleware/auth.js"
import type {
  InsufficientScopeError,
  InvalidRequestError,
  InvalidTokenError,
  UnauthorizedError as JWTUnauthorizedError
} from "express-oauth2-jwt-bearer"
import { makeUserProfileFromUserHeader, UserProfile } from "../../services/UserProfile.js"
import { HttpServerRequest } from "../http.js"
import type { GetCTX } from "./ctx.js"

const authConfig = Auth0Config.runSync$

export class JWTError extends Data.TaggedClass("JWTError")<{
  error:
    | InsufficientScopeError
    | InvalidRequestError
    | InvalidTokenError
    | JWTUnauthorizedError
}> {}

const manager = NonEmptyString255("manager")

export const MakeContext = (userProfile: Option<UserProfile>) =>
  Effect.gen(function*() {
    let context = Context.empty()

    if (userProfile.isSome()) {
      context = context.add(UserProfile, userProfile.value)
    }

    return context
  })

export function RequestEnv<Req extends RequestConfig>(handler: { Request: Req }) {
  const allowAnonymous = !!handler.Request.allowAnonymous
  const allowedRoles: readonly Role[] = handler.Request.allowedRoles ?? ["manager"]
  return Effect.gen(function*($) {
    if (!allowAnonymous) {
      yield* $(checkJWTI(authConfig).catchAll((err) => Effect.fail(new JWTError({ error: err }))))
    }
    const rcc = yield* $(RequestContextContainer)
    const req = yield* $(HttpServerRequest)

    const r = makeUserProfileFromUserHeader(req.headers["x-user"]).exit.runSync$
    // const r = makeUserProfileFromAuthorizationHeader(req.headers["authorization"]).exit.runSync$
    const userProfile = Option.fromNullable(r.isSuccess() ? r.value : undefined)

    yield* $(rcc.update((_): RequestContext => ({ ..._, userProfile: userProfile.value })))

    if (!allowAnonymous && !userProfile.value) {
      return yield* $(new NotLoggedInError())
    }
    const userRoles = userProfile
      .map((_) => _.roles.includes(manager) ? [Role("manager"), Role("user")] : [Role("user")])
      .getOrElse(() => [Role("user")])

    if (!allowedRoles.some((_) => userRoles.includes(_))) {
      return yield* $(new UnauthorizedError())
    }
    const myCtx = yield* $(MakeContext(userProfile))

    return myCtx
  })
}

export type RequestEnv = ContextA<Effect.Success<ReturnType<typeof RequestEnv>>>

export function handleRequestEnv<
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
  PPath extends `/${string}`
>(
  handler: RequestHandler<R, M, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, ResE, PPath>
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
          .flatMap((ctx) =>
            (handler.h as (i: any, ctx: GetCTX<typeof handler>) => Effect<R, ResE, ResA>)(pars, ctx as any /* TODO */)
          )
    },
    makeContext: RequestEnv(handler)
  }
}
type ContextA<X> = X extends Context<infer A> ? A : never

export interface RequestHandlerBase<
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
  PPath extends `/${string}`
> extends RequestConfig {
  adaptResponse?: any
  h: (i: PathA & QueryA & BodyA & {}) => Effect<R, ResE, ResA>
  Request: Request<M, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, PPath>
  Response: ReqRes<unknown, ResA> | ReqResSchemed<unknown, ResA>
  ResponseOpenApi?: any
}

export interface RequestHandler<
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
  PPath extends `/${string}`
> {
  adaptResponse?: any
  h: (i: PathA & QueryA & BodyA & {}, ctx: any /* TODO */) => Effect<R, ResE, ResA>
  Request: Request<M, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, PPath> & RequestConfig
  Response: ReqRes<unknown, ResA> | ReqResSchemed<unknown, ResA>
  ResponseOpenApi?: any
}

export interface RequestHandlerOrig<
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
  PPath extends `/${string}`
> {
  adaptResponse?: any
  h: (i: PathA & QueryA & BodyA & {}) => Effect<R, ResE, ResA>
  Request: Request<M, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, PPath> & RequestConfig
  Response: ReqRes<unknown, ResA> | ReqResSchemed<unknown, ResA>
  ResponseOpenApi?: any
}
