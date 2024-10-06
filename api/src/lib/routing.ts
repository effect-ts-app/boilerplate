/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { Rpc } from "@effect/rpc"
import type { S } from "effect-app"
import { Config, Context, Duration, Effect, Exit, HashMap, Layer, Option, Request } from "effect-app"
import { ApiConfig } from "effect-app/client"
import { HttpClient, HttpClientRequest } from "effect-app/http"
import type * as EffectRequest from "effect/Request"
import type { ContextMapCustom, ContextMapInverted, GetEffectContext } from "resources/lib/DynamicMiddleware.js"
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

// const checkRoles = (request: any, userProfile: Option<UserProfile>) =>
//   Effect.gen(function*() {
//     const userRoles = Option
//       .map(userProfile, (_) => _.roles.includes("manager") ? [Role("manager"), Role("user")] : [Role("user")])
//       .pipe(Option.getOrElse(() => [Role("user")]))
//     const allowedRoles: readonly Role[] = request.allowRoles ?? ["user"]
//     if (!allowedRoles.some((_) => userRoles.includes(_))) {
//       return yield* new UnauthorizedError()
//     }
//   })

// const UserAuthorizationLive = <Req extends RequestConfig>(request: Req) =>
//   Effect
//     .gen(function*() {
//       if (!fakeLogin && !request.allowAnonymous) {
//         yield* Effect.catchAll(
//           checkJWTI({
//             ...authConfig,
//             issuer: authConfig.issuer + "/",
//             jwksUri: `${authConfig.issuer}/.well-known/jwks.json`
//           }),
//           (err) => Effect.fail(new JWTError({ error: err }))
//         )
//       }
//       const req = yield* HttpServerRequest.HttpServerRequest
//       const r = (fakeLogin
//         ? makeUserProfileFromUserHeader(req.headers["x-user"])
//         : makeUserProfileFromAuthorizationHeader(
//           req.headers["authorization"]
//         ))
//         .pipe(Effect.exit, basicRuntime.runSync)
//       if (!Exit.isSuccess(r)) {
//         yield* Effect.logWarning("Parsing userInfo failed").pipe(Effect.annotateLogs("r", r))
//       }
//       const userProfile = Option.fromNullable(Exit.isSuccess(r) ? r.value : undefined)

//       const rcc = yield* RequestContextContainer
//       const up = Option.getOrUndefined(userProfile)
//       yield* rcc.update((_): RequestContext => ({ ..._, userProfile: up }))

//       if (!request.allowAnonymous && !up) {
//         return yield* new NotLoggedInError()
//       }

//       yield* checkRoles(request, userProfile)

//       if (up) {
//         return Layer.succeed(UserProfile, up)
//       }
//       return Layer.empty
//     })
//     .pipe(Effect.withSpan("middleware"), Layer.unwrapEffect)

// export const RequestEnv = <Req extends RequestConfig>(handler: { Request: Req }) =>
//   Layer.mergeAll(UserAuthorizationLive(handler.Request))

// export type RequestEnv = Layer.Layer.Success<ReturnType<typeof RequestEnv>>

// TODO: parameterise the Middleware handler and extract to DynamicMiddlware.ts?..
// TODO: <CTXMap extends Record<string, [string, any, S.Schema.Any, any]>>
export const makeRpc = () => {
  return {
    effect: <T extends { config?: { [K in keyof CTXMap]?: any } }, Req extends S.TaggedRequest.All, R>(
      schema: T & S.Schema<Req, any, never>,
      handler: (
        request: Req
      ) => Effect.Effect<
        EffectRequest.Request.Success<Req>,
        EffectRequest.Request.Error<Req>,
        R
      >
    ) =>
      Rpc.effect<Req, Exclude<R, GetEffectContext<CTXMap, T["config"]>>>(
        schema,
        (req) =>
          Effect.gen(function*() {
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

            return yield* handler(req).pipe(Effect.provide(ctx))
          }) as any
      )
  }
}

// const makeClient = <Router extends RpcRouter<S.TaggedRequest.All, never>>() =>
//   Effect.gen(function*() {
//     const client = yield* HttpClient.HttpClient
//     const config = yield* ApiConfig.Tag
//     const resolver = HttpRpcResolver
//       .make<Router>(
//         client.pipe(
//           HttpClient.mapRequest(HttpClientRequest.prependUrl(config.apiUrl + "/rpc")),
//           HttpClient.mapRequest(
//             HttpClientRequest.setHeaders(config.headers.pipe(Option.getOrElse(() => HashMap.empty())))
//           )
//         )
//       )
//     return RpcResolver.toClient(resolver)
//   })

export const apiClient = Effect.gen(function*() {
  const client = yield* HttpClient.HttpClient
  const config = yield* ApiConfig.Tag
  return client.pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl(config.apiUrl + "/rpc")),
    HttpClient.mapRequest(
      HttpClientRequest.setHeaders(config.headers.pipe(Option.getOrElse(() => HashMap.empty())))
    )
  )
})

export const RPC = makeRpc()
