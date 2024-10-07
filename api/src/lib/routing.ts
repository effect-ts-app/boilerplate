/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { makeRouter2 } from "@effect-app/infra/api/routing2"
import type {
  ContextMapCustom,
  ContextMapInverted,
  GetEffectContext
} from "@effect-app/infra/api/routing2/DynamicMiddleware"
import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { Rpc } from "@effect/rpc"
import type { S } from "effect-app"
import { Config, Context, Duration, Effect, Exit, FiberRef, Layer, Option, Request } from "effect-app"
import { HttpHeaders, HttpServerRequest } from "effect-app/http"
import { NonEmptyString255 } from "effect-app/schema"
import type * as EffectRequest from "effect/Request"
import {
  makeUserProfileFromAuthorizationHeader,
  makeUserProfileFromUserHeader,
  UserProfile
} from "../services/UserProfile.js"
import { basicRuntime } from "./basicRuntime.js"

export interface CTX {
  context: RequestContext
}

export type CTXMap = {
  allowAnonymous: ContextMapInverted<"userProfile", UserProfile, typeof NotLoggedInError>
  // TODO: not boolean but `string[]`
  requireRoles: ContextMapCustom<"", void, typeof UnauthorizedError, Array<string>>
}

export const RequestCacheLayers = Layer.mergeAll(
  Layer.setRequestCache(
    Request.makeCache({ capacity: 500, timeToLive: Duration.hours(8) })
  ),
  Layer.setRequestCaching(true),
  Layer.setRequestBatching(true)
)

export const Auth0Config = Config.all({
  audience: Config.string("audience").pipe(Config.nested("auth0"), Config.withDefault("http://localhost:3610")),
  issuer: Config.string("issuer").pipe(
    Config.nested("auth0"),
    Config.withDefault("https://effect-app-boilerplate-dev.eu.auth0.com")
  )
})

// const authConfig = basicRuntime.runSync(Auth0Config)
// const fakeLogin = true

const middleware = {
  contextMap: null as unknown as CTXMap,
  // helper to deal with nested generic lmitations
  context: null as any as
    | RequestContextContainer
    | HttpServerRequest.HttpServerRequest,
  execute: <T extends { config?: { [K in keyof CTXMap]?: any } }, Req extends S.TaggedRequest.All, R>(
    schema: T & S.Schema<Req, any, never>,
    handler: (request: Req) => Effect.Effect<EffectRequest.Request.Success<Req>, EffectRequest.Request.Error<Req>, R>,
    moduleName?: string
  ) =>
  (
    req: Req
  ): Effect.Effect<
    Request.Request.Success<Req>,
    Request.Request.Error<Req>,
    | RequestContextContainer
    | HttpServerRequest.HttpServerRequest
    | Exclude<R, GetEffectContext<CTXMap, T["config"]>>
  > =>
    Effect
      .gen(function*() {
        const headers = yield* Rpc.currentHeaders
        let ctx = Context.empty()

        const config = "config" in schema ? schema.config : undefined

        // Check JWT
        // TODO
        // if (!fakeLogin && !request.allowAnonymous) {
        //   yield* Effect.catchAll(
        //     checkJWTI({
        //       ...authConfig,
        //       issuer: authConfig.issuer + "/",
        //       jwksUri: `${authConfig.issuer}/.well-known/jwks.json`
        //     }),
        //     (err) => Effect.fail(new JWTError({ error: err }))
        //   )
        // }

        const fakeLogin = true
        const r = (fakeLogin
          ? makeUserProfileFromUserHeader(headers["x-user"])
          : makeUserProfileFromAuthorizationHeader(
            headers["authorization"]
          ))
          .pipe(Effect.exit, basicRuntime.runSync)
        if (!Exit.isSuccess(r)) {
          yield* Effect.logWarning("Parsing userInfo failed").pipe(Effect.annotateLogs("r", r))
        }
        const userProfile = Option.fromNullable(Exit.isSuccess(r) ? r.value : undefined)
        if (Option.isSome(userProfile)) {
          ctx = ctx.pipe(Context.add(UserProfile, userProfile.value))
        } else if (config && !config.allowAnonymous) {
          return yield* new NotLoggedInError({ message: "no auth" })
        }

        if (config?.requireRoles) {
          // TODO
          if (
            !userProfile.value
            || !(config.requireRoles as any).every((role: any) => userProfile.value!.roles.includes(role))
          ) {
            return yield* new UnauthorizedError()
          }
        }

        return yield* handler(req).pipe(Effect.provide(ctx as Context.Context<GetEffectContext<CTXMap, T["config"]>>))
      })
      .pipe(
        Effect.provide(
          Effect
            .gen(function*() {
              yield* RequestContextContainer.update((_) => ({
                ..._,
                name: NonEmptyString255(moduleName ? `${moduleName}.${req._tag}` : req._tag)
              }))
              const httpReq = yield* HttpServerRequest.HttpServerRequest
              // TODO: only pass Authentication etc, or move headers to actual Rpc Headers
              yield* FiberRef.update(
                Rpc.currentHeaders,
                (headers) =>
                  HttpHeaders.merge(
                    httpReq.headers,
                    headers
                  )
              )
            })
            .pipe(Layer.effectDiscard)
        )
      ) as any
}

export const { matchAll, matchFor } = makeRouter2(middleware)
