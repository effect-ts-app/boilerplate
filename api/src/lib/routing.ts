/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { EffectUnunified } from "@effect-app/core/Effect"
import { typedKeysOf } from "@effect-app/core/utils"
import type { Compute } from "@effect-app/core/utils"
import type { _E, _R } from "@effect-app/infra/api/routing"
import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { Rpc, RpcRouter } from "@effect/rpc"
import { HttpRpcRouter } from "@effect/rpc-http"
import type { S } from "effect-app"
import { Config, Context, Duration, Effect, Exit, FiberRef, Layer, Option, Predicate, Request } from "effect-app"
import { HttpHeaders, HttpRouter, HttpServerRequest } from "effect-app/http"
import { NonEmptyString255 } from "effect-app/schema"
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

interface Middleware<Context, CTXMap extends Record<string, [string, any, S.Schema.All, any]>> {
  contextMap: CTXMap
  context: Context
  execute: <
    T extends {
      config?: { [K in keyof CTXMap]?: any }
    },
    Req extends S.TaggedRequest.All,
    R
  >(
    schema: T & S.Schema<Req, any, never>,
    handler: (
      request: Req
    ) => Effect.Effect<EffectRequest.Request.Success<Req>, EffectRequest.Request.Error<Req>, R>,
    moduleName?: string
  ) => (
    req: Req
  ) => Effect.Effect<
    Request.Request.Success<Req>,
    Request.Request.Error<Req>,
    any // smd
  >
}

export const makeRpc = <Context, CTXMap extends Record<string, [string, any, S.Schema.All, any]>>(
  middleware: Middleware<Context, CTXMap>
) => {
  return {
    effect: <T extends { config?: { [K in keyof CTXMap]?: any } }, Req extends S.TaggedRequest.All, R>(
      schema: T & S.Schema<Req, any, never>,
      handler: (
        request: Req
      ) => Effect.Effect<
        EffectRequest.Request.Success<Req>,
        EffectRequest.Request.Error<Req>,
        R
      >,
      moduleName?: string
    ) => {
      return Rpc.effect<Req, Context | Exclude<R, GetEffectContext<CTXMap, T["config"]>>>(
        schema,
        middleware.execute(schema, handler, moduleName)
      )
    }
  }
}

export const RPC = makeRpc(middleware)

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

// export type RouteMatch<
//   R,
//   M,
//   // TODO: specific errors
//   // Err extends SupportedErrors | S.ParseResult.ParseError,
//   PR = never
// > // RErr = never,
//  = Rpc.Rpc<never, Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>>

export interface Hint<Err extends string> {
  Err: Err
}

type HandleVoid<Expected, Actual, Result> = [Expected] extends [void]
  ? [Actual] extends [void] ? Result : Hint<"You're returning non void for a void Response, please fix">
  : Result

type AnyRequestModule = S.Schema.Any & { success?: S.Schema.Any; failure?: S.Schema.Any }

type GetSuccess<T> = T extends { success: S.Schema.Any } ? T["success"] : typeof S.Void

type GetSuccessShape<Action extends { success?: S.Schema.Any }, RT extends "d" | "raw"> = RT extends "raw"
  ? S.Schema.Encoded<GetSuccess<Action>>
  : S.Schema.Type<GetSuccess<Action>>
type GetFailure<T extends { failure?: S.Schema.Any }> = T["failure"] extends never ? typeof S.Never : T["failure"]

export interface Handler<Action extends AnyRequestModule, RT extends "raw" | "d", A, E, R, Context> {
  new(): {}
  _tag: RT
  handler: (
    req: S.Schema.Type<Action>,
    ctx: Context
  ) => Effect<
    A,
    E,
    R
  >
}

// Separate "raw" vs "d" to verify A (Encoded for "raw" vs Type for "d")
type AHandler<Action extends AnyRequestModule> =
  | Handler<
    Action,
    "raw",
    S.Schema.Encoded<GetSuccess<Action>>,
    S.Schema.Type<GetFailure<Action>>,
    any,
    { Response: any }
  >
  | Handler<
    Action,
    "d",
    S.Schema.Type<GetSuccess<Action>>,
    S.Schema.Type<GetFailure<Action>>,
    any,
    { Response: any }
  >

// type GetRouteContext<T> =
//   & CTX
//   // inverted
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends true ? never
//         : key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never
//         : never
//     ]?: CTXMap[key][1]
//   }
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends true ? never
//         : key extends keyof T ? T[key] extends false ? CTXMap[key][0] : never
//         : CTXMap[key][0]
//     ]: CTXMap[key][1]
//   }
//   // normal
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends false ? never
//         : key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never
//         : never
//     ]: CTXMap[key][1]
//   }
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends false ? never
//         : key extends keyof T ? T[key] extends false ? CTXMap[key][0] : never
//         : CTXMap[key][0]
//     ]?: CTXMap[key][1]
//   }

type Filter<T> = {
  [K in keyof T as T[K] extends S.Schema.All & { success: S.Schema.Any; failure: S.Schema.Any } ? K : never]: T[K]
}

export const makeRouter = <Context, CTXMap extends Record<string, [string, any, S.Schema.All, any]>>(
  middleware: Middleware<Context, CTXMap>
) => {
  const rpc = makeRpc(middleware)
  function matchFor<Rsc extends Record<string, any> & { meta: { moduleName: string } }>(
    rsc: Rsc
  ) {
    const meta = (rsc as any).meta as { moduleName: string }
    if (!meta) throw new Error("Resource has no meta specified") // TODO: do something with moduleName+cur etc.

    type Filtered = Filter<Rsc>
    const filtered = typedKeysOf(rsc).reduce((acc, cur) => {
      if (Predicate.isObject(rsc[cur]) && rsc[cur]["success"]) {
        acc[cur as keyof Filtered] = rsc[cur]
      }
      return acc
    }, {} as Filtered)

    const matchWithServices = <Key extends keyof Filtered>(action: Key) => {
      return <
        SVC extends Record<
          string,
          Effect<any, any, any>
        >,
        R2,
        E,
        A
      >(
        _services: SVC,
        f: (
          req: S.Schema.Type<Rsc[Key]>,
          ctx: any
          // ctx: Compute<
          //   LowerServices<EffectDeps<SVC>> & never // ,
          //   "flat"
          // >
        ) => Effect<A, E, R2>
      ) =>
      (req: any) =>
        // Effect.andThen(allLower(services), (svc2) =>
        // ...ctx, ...svc2,
        f(req, { Response: rsc[action].success })
    }

    type MatchWithServicesNew<RT extends "raw" | "d", Key extends keyof Rsc> = {
      <R2, E, A>(
        f: Effect<A, E, R2>
      ): HandleVoid<
        GetSuccessShape<Rsc[Key], RT>,
        A,
        Handler<
          Rsc[Key],
          RT,
          A,
          E,
          Exclude<R2, GetEffectContext<CTXMap, Rsc[Key]["config"]>>,
          { Response: Rsc[Key]["success"] } //
        >
      >

      <R2, E, A>(
        f: (
          req: S.Schema.Type<Rsc[Key]>,
          ctx: { Response: Rsc[Key]["success"] }
        ) => Effect<A, E, R2>
      ): HandleVoid<
        GetSuccessShape<Rsc[Key], RT>,
        A,
        Handler<
          Rsc[Key],
          RT,
          A,
          E,
          Exclude<R2, GetEffectContext<CTXMap, Rsc[Key]["config"]>>,
          { Response: Rsc[Key]["success"] } //
        >
      >

      <
        SVC extends Record<
          string,
          EffectUnunified<any, any, any>
        >,
        R2,
        E,
        A
      >(
        services: SVC,
        f: (
          req: S.Schema.Type<Rsc[Key]>,
          ctx: Compute<
            // LowerServices<EffectDeps<SVC>> & Pick<Rsc[Key], "success">,
            { Response: Rsc[Key] },
            "flat"
          >
        ) => Effect<A, E, R2>
      ): HandleVoid<
        GetSuccessShape<Rsc[Key], RT>,
        A,
        Handler<
          Rsc[Key],
          RT,
          A,
          E,
          Exclude<R2, GetEffectContext<CTXMap, Rsc[Key]["config"]>>,
          { Response: Rsc[Key]["success"] } //
        >
      >
    }

    type Keys = keyof Filtered

    const controllers = <
      THandlers extends {
        // import to keep them separate via | for type checking!!
        [K in Keys]: AHandler<Rsc[K]>
      }
    >(
      controllers: THandlers
    ) => {
      const handlers = typedKeysOf(filtered).reduce(
        (acc, cur) => {
          if (cur === "meta") return acc
          ;(acc as any)[cur] = {
            h: controllers[cur as keyof typeof controllers].handler,
            Request: rsc[cur]
          }

          return acc
        },
        {} as {
          [K in Keys]: {
            h: (
              r: S.Schema.Type<Rsc[K]>
            ) => Effect<
              S.Schema.Type<GetSuccess<Rsc[K]>>,
              _E<ReturnType<THandlers[K]["handler"]>>,
              _R<ReturnType<THandlers[K]["handler"]>>
            >
            Request: Rsc[K]
          }
        }
      )

      const mapped = typedKeysOf(handlers).reduce((acc, cur) => {
        const handler = handlers[cur]
        const req = handler.Request

        // class Request extends (req as any) {
        //   static path = "/" + handler.name + (req.path === "/" ? "" : req.path)
        //   static method = req.method === "AUTO"
        //     ? REST.determineMethod(handler.name.split(".")[1]!, req)
        //     : req.method
        // }
        // if (req.method === "AUTO") {
        //   Object.assign(Request, {
        //     [Request.method === "GET" || Request.method === "DELETE" ? "Query" : "Body"]: req.Auto
        //   })
        // }
        // Object.assign(handler, { Request })
        acc[cur] = rpc.effect(req, handler.h as any, meta.moduleName) // TODO
        return acc
      }, {} as any) as {
        [K in Keys]: Rpc.Rpc<
          Rsc[K],
          _R<ReturnType<THandlers[K]["handler"]>>
        >
      }

      type RPCRouteR<T extends Rpc.Rpc<any, any>> = [T] extends [
        Rpc.Rpc<any, infer R>
      ] ? R
        : never

      type RPCRouteReq<T extends Rpc.Rpc<any, any>> = [T] extends [
        Rpc.Rpc<infer Req, any>
      ] ? Req
        : never

      const router = RpcRouter.make(...Object.values(mapped) as any) as RpcRouter.RpcRouter<
        RPCRouteReq<typeof mapped[keyof typeof mapped]>,
        RPCRouteR<typeof mapped[keyof typeof mapped]>
      >

      return HttpRouter.empty.pipe(
        HttpRouter.all(("/rpc/" + rsc.meta.moduleName) as any, HttpRpcRouter.toHttpApp(router))
      )
    }

    const r = {
      controllers,
      ...typedKeysOf(filtered).reduce(
        (prev, cur) => {
          ;(prev as any)[cur] = (svcOrFnOrEffect: any, fnOrNone: any) => {
            const stack = new Error().stack?.split("\n").slice(2).join("\n")
            return Effect.isEffect(svcOrFnOrEffect)
              ? class {
                static stack = stack
                static _tag = "d"
                static handler = () => svcOrFnOrEffect
              }
              : typeof svcOrFnOrEffect === "function"
              ? class {
                static stack = stack
                static _tag = "d"
                static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].success })
              }
              : class {
                static stack = stack
                static _tag = "d"
                static handler = matchWithServices(cur)(svcOrFnOrEffect, fnOrNone)
              }
          }
          ;(prev as any)[(cur as any) + "Raw"] = (svcOrFnOrEffect: any, fnOrNone: any) => {
            const stack = new Error().stack?.split("\n").slice(2).join("\n")
            return Effect.isEffect(svcOrFnOrEffect)
              ? class {
                static stack = stack
                static _tag = "raw"
                static handler = () => svcOrFnOrEffect
              }
              : typeof svcOrFnOrEffect === "function"
              ? class {
                static stack = stack
                static _tag = "raw"
                static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].success })
              }
              : class {
                static stack = stack
                static _tag = "raw"
                static handler = matchWithServices(cur)(svcOrFnOrEffect, fnOrNone)
              }
          }
          return prev
        },
        {} as
          & {
            // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
            /**
             * Requires the Type shape
             */
            [Key in keyof Filtered]: MatchWithServicesNew<"d", Key>
          }
          & {
            // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
            /**
             * Requires the Encoded shape (e.g directly undecoded from DB, so that we don't do multiple Decode/Encode)
             */
            [Key in keyof Filtered as Key extends string ? `${Key}Raw` : never]: MatchWithServicesNew<"raw", Key>
          }
      )
    }
    return r
  }

  return { matchFor }
}

type RequestHandlersTest = {
  [key: string]: HttpRouter.HttpRouter<any, any>
}
export function matchAll<T extends RequestHandlersTest>(handlers: T) {
  const r = typedKeysOf(handlers).reduce((acc, cur) => {
    return HttpRouter.concat(acc, handlers[cur] as any)
  }, HttpRouter.empty)

  type _RRouter<T extends HttpRouter.HttpRouter<any, any>> = [T] extends [
    HttpRouter.HttpRouter<any, infer R>
  ] ? R
    : never

  type _ERouter<T extends HttpRouter.HttpRouter<any, any>> = [T] extends [
    HttpRouter.HttpRouter<infer E, any>
  ] ? E
    : never

  return r as HttpRouter.HttpRouter<
    _ERouter<typeof handlers[keyof typeof handlers]>,
    _RRouter<typeof handlers[keyof typeof handlers]>
  >
}

export const { matchFor } = makeRouter(middleware)
