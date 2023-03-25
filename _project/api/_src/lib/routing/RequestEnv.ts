/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { BasicRequestEnv } from "@effect-app-boilerplate/messages/RequestLayers"
import type { Request } from "@effect-app/infra/api/express/schema/requestHandler"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { ReqRes, ReqResSchemed } from "@effect-app/prelude/schema"
import type express from "express"
import { CurrentUser, UserRepo } from "../../services.js"
import { UserProfile } from "../../services/UserProfile.js"
import type { CTX } from "./ctx.js"

// const manager = ReasonableString("manager")

export function RequestEnv(handler: { Request: any }) {
  return (_req: express.Request, _res: express.Response) => {
    const allowAnonymous = !!handler.Request.allowAnonymous
    // const allowedRoles: readonly Role[] = handler.Request.allowedRoles ?? ["manager"]
    return Effect.gen(function*($) {
      const requestContext = yield* $(RequestContextContainer.get)

      const userProfile = requestContext.user
        ? Option.some(requestContext.user)
        : Option.none

      if (!allowAnonymous && !userProfile.value) {
        return yield* $(Effect.fail(new NotLoggedInError()))
      }
      // const userRoles = userProfile.map(_ =>
      //   _.roles.includes(manager) ? [Role("manager"), Role("user")] : [Role("user")]
      // )
      //   .getOrElse(() => [Role("user")])

      // if (!allowedRoles.some(_ => userRoles.includes(_))) {
      //   return yield* $(Effect.fail(new UnauthorizedError()))
      // }
      const ctx = yield* $(BasicRequestEnv)
      return ctx.add(
        UserProfile,
        UserProfile.make({
          get: Effect(userProfile).flatMap(_ => _.encaseInEffect(() => new NotLoggedInError()))
        })
      )
    })
  }
}

/**
 * @tsplus static CurrentUser fromUserProfile
 */
export function fromUserProfile() {
  return UserRepo.accessWithEffect(_ => _.getCurrentUser)
    .map(_ => CurrentUser.make({ get: Effect(_) }))
}

export type RequestEnv = ContextA<Effect.Success<ReturnType<ReturnType<typeof RequestEnv>>>>

export function handleRequestEnv<
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
    handler: {
      ...handler,
      h: (pars: any) =>
        Debug.untraced(restore =>
          Effect.all({
            context: RequestContextContainer.get,
            // TODO: user should only be fetched and type wise available when not allow anonymous
            user: UserProfile.accessWithEffect(_ => _.get.catchAll(() => Effect(undefined)))
          })
            .flatMap(ctx => restore(handler.h as (i: any, ctx: any) => Effect<R, ResE, ResA>)(pars, ctx))
        )
    },
    makeContext: RequestEnv(handler)
  }
}
type ContextA<X> = X extends Context<infer A> ? A : never

export interface RequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE
> {
  adaptResponse?: any
  h: (i: PathA & QueryA & BodyA & {}, ctx: CTX) => Effect<R, ResE, ResA>
  Request: Request<PathA, CookieA, QueryA, BodyA, HeaderA, ReqA>
  Response: ReqRes<unknown, ResA> | ReqResSchemed<unknown, ResA>
  ResponseOpenApi?: any
}
