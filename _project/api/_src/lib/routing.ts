/* eslint-disable @typescript-eslint/ban-types */
import { BasicRequestEnv } from "@effect-app-boilerplate/messages/RequestLayers"
import type { User } from "@effect-app-boilerplate/models/User"
import { Role } from "@effect-app-boilerplate/models/User"
import type { Compute } from "@effect-app/core/utils"
import type { SupportedErrors } from "@effect-app/infra/api/defaultErrorHandler"
import { defaultErrorHandler } from "@effect-app/infra/api/defaultErrorHandler"
import type { _E, _R, Request } from "@effect-app/infra/api/express/schema/requestHandler"
import type { Flatten, ReqFromSchema, ReqHandler, ResFromSchema, RouteMatch } from "@effect-app/infra/api/routing"
import { handle, match } from "@effect-app/infra/api/routing"
import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import { RequestContext } from "@effect-app/infra/RequestContext"
import type { GetRequest, GetResponse, ReqRes, ReqResSchemed } from "@effect-app/prelude/schema"
import type { EffectTypeId } from "@effect/io/Effect"
import type express from "express"
import { CurrentUser, UserRepo } from "../services.js"
import { makeUserProfileFromUserHeader, UserProfile } from "../services/UserProfile.js"

function RequestEnv(handler: { Request: any }) {
  return (req: express.Request, _res: express.Response, requestContext: RequestContext) => {
    const allowAnonymous = !!handler.Request.allowAnonymous
    const allowedRoles: readonly Role[] = handler.Request.allowedRoles ?? ["manager"]
    return Effect.gen(function*($) {
      const ctx = yield* $(BasicRequestEnv(requestContext))

      const p = makeUserProfileFromUserHeader(req.headers["x-user"])
        .map(Option.some)
      const userProfile = allowAnonymous
        ? p.catchAll(() => Effect(Option.none))
        : p.mapError(() => new NotLoggedInError())

      return pipe(
        ctx,
        Context.add(
          UserProfile,
          UserProfile.make({ get: userProfile.flatMap(_ => _.encaseInEffect(() => new NotLoggedInError())) })
        )
      )
    }).flatMap(ctx =>
      Effect.gen(function*($) {
        const currentUser = yield* $(
          UserRepo.accessWithEffect(_ => _.getCurrentUser)
            .map(Option.some)
            .catchAll(() => allowAnonymous ? Effect(Option.none) : Effect.fail(new NotLoggedInError()))
            .tap(_ => {
              const userRoles = _.map(_ => _.role === "manager" ? [Role("manager"), Role("user")] : [_.role]).getOrElse(
                () => [Role("user")]
              )
              return allowedRoles.some(_ => userRoles.includes(_))
                ? Effect.unit
                : Effect.fail(new UnauthorizedError())
            })
            .map(_ => CurrentUser.make({ get: _.encaseInEffect(() => new NotLoggedInError()) }))
        )

        return pipe(
          ctx,
          Context.add(CurrentUser, currentUser)
        )
      }).provideSomeContextReal(ctx)
    )
  }
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = match(handlers[cur] as any, defaultErrorHandler, handleRequestEnv)
    return prev
  }, {} as any) as RouteAllLoggedIn<typeof handlers>

  return mapped
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAllAlt<T extends RequestHandlersTest>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    const matches = matchAll(handlers[cur])
    matches.$$.keys.forEach(key => prev[`${cur as string}.${key as string}`] = matches[key])
    return prev
  }, {} as any) as Flatten<RouteAllLoggedInTest<typeof handlers>>

  return mapped
}

export type SupportedRequestHandler = RequestHandler<any, any, any, any, any, any, any, any, SupportedErrors>

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

export type RequestHandlers = { [key: string]: SupportedRequestHandler }
export type RequestHandlersTest = {
  [key: string]: Record<string, SupportedRequestHandler>
}

type RouteAll<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends RequestHandler<
    infer R,
    any, // infer PathA,
    any, // infer CookieA,
    any, // infer QueryA,
    any, // infer BodyA,
    any, // infer HeaderA,
    any, // infer ReqA,
    any, // infer ResA,
    SupportedErrors // infer ResE
  > ? RouteMatch<R, never>
    : never
}

export type RouteAllTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAll<T[K]>
}

type ContextA<X> = X extends Context<infer A> ? A : never
export type RequestEnv = ContextA<Effect.Success<ReturnType<ReturnType<typeof RequestEnv>>>>

function handleRequestEnv<
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
          Effect.struct({
            context: RequestContext.Tag.access,
            user: CurrentUser.get.catchTag("NotLoggedInError", () => Effect(null))
          })
            .flatMap(ctx => restore(handler.h as (i: any, ctx: any) => Effect<R, ResE, ResA>)(pars, ctx))
        )
    },
    makeContext: RequestEnv(handler)
  }
}

type RouteAllLoggedIn<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends RequestHandler<
    infer R,
    any, // infer PathA,
    any, // infer CookieA,
    any, // infer QueryA,
    any, // infer BodyA,
    any, // infer HeaderA,
    any, // infer ReqA,
    any, // infer ResA,
    SupportedErrors // infer ResE
  > ? RouteMatch<R, RequestEnv>
    : never
}

export type RouteAllLoggedInTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAllLoggedIn<T[K]>
}

export function matchResource<TModules extends Record<string, Record<string, any>>>(mod: TModules) {
  type Keys = keyof TModules
  return <
    THandlers extends {
      [K in Keys]: (
        req: ReqFromSchema<GetRequest<TModules[K]>>,
        ctx: CTX
      ) => Effect<any, SupportedErrors, ResFromSchema<GetResponse<TModules[K]>>>
    }
  >(
    handlers: THandlers
  ) => {
    const handler = mod.$$.keys.reduce((prev, cur) => {
      prev[cur] = handle(mod[cur])(handlers[cur] as any)
      return prev
    }, {} as any)
    type HNDLRS = typeof handlers
    return handler as {
      [K in Keys]: ReqHandler<
        ReqFromSchema<GetRequest<TModules[K]>>,
        _R<ReturnType<HNDLRS[K]>>,
        _E<ReturnType<HNDLRS[K]>>,
        ResFromSchema<GetResponse<TModules[K]>>,
        GetRequest<TModules[K]>,
        GetResponse<TModules[K]>,
        CTX
      >
    }
  }
}

export const matchAction = <Module extends Record<string, any>, R, R2, E extends SupportedErrors>(
  _: Module,
  f: Effect<
    R,
    never,
    (
      req: ReqFromSchema<GetRequest<Module>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Module>>>
  >
) => f

export interface CTX {
  context: RequestContext
  user: User
}

type Service<T> = T extends Tag<infer S> ? S : never
type Values<T> = T extends { [s: string]: infer S } ? Service<S> : never
type LowerFirst<S extends PropertyKey> = S extends `${infer First}${infer Rest}` ? `${Lowercase<First>}${Rest}` : S
type LowerServices<T extends Record<string, Tag<any>>> = { [key in keyof T as LowerFirst<key>]: Service<T[key]> }

export function matchFor<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  const matchWithServices_ = <
    Key extends keyof Rsc,
    SVC extends Record<string, Tag<any>>,
    R2,
    E extends SupportedErrors
  >(
    action: Key,
    services: SVC,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: Compute<LowerServices<SVC> & CTX, "flat">
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) =>
    matchAction(
      rsc[action],
      Effect.context<Values<SVC>>().flatMap(context =>
        Effect.servicesWith(services, svc => (req, ctx) =>
          f(req, { ...ctx, ...svc as any }).provideSomeContextReal(context))
      )
    )

  const matchWithServices: <Key extends keyof Rsc>(
    action: Key
  ) => <SVC extends Record<string, Tag<any>>, R2, E extends SupportedErrors>(
    services: SVC,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: Compute<LowerServices<SVC> & CTX, "flat">
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) => Effect<
    Values<SVC>,
    never,
    (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<Exclude<R2, Values<SVC>>, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  > = action => (services, f) => matchWithServices_(action, services, f)

  const matchWithEffect_ = <Key extends keyof Rsc, R, R2, E extends SupportedErrors>(
    action: Key,
    f: Effect<
      R,
      never,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: CTX
      ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
    >
  ) => matchAction(rsc[action], f)

  const matchWithEffect: <Key extends keyof Rsc>(
    action: Key
  ) => <R, R2, E extends SupportedErrors>(
    f: Effect<
      R,
      never,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: {
          context: RequestContext
          user: User
        }
      ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
    >
  ) => Effect<
    R,
    never,
    (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  > = action => f => matchWithEffect_(action, f)

  const matchWith_ = <Key extends keyof Rsc, R2, E extends SupportedErrors>(
    action: Key,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) => matchAction(rsc[action], Effect.sync(() => f))

  const matchWith: <Key extends keyof Rsc>(
    action: Key
  ) => <R2, E extends SupportedErrors>(
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) => Effect<
    never,
    never,
    (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  > = action => f => matchWith_(action, f)
  type Keys = keyof Rsc

  type Handler<K extends keyof Rsc, R> = (
    req: ReqFromSchema<GetRequest<Rsc[K]>>,
    ctx: CTX
  ) => Effect<R, SupportedErrors, ResFromSchema<GetResponse<Rsc[K]>>>

  type GetHandler<T> = T extends Handler<any, any> ? ReturnType<T> : never

  const controllers = <
    THandlers extends {
      [K in Keys]: Effect<any, any, Handler<K, any>>
    }
  >(
    controllers: THandlers
  ) => {
    const handler = Effect.struct(controllers).map(handlers =>
      rsc.$$.keys.reduce((prev, cur) => {
        prev[cur] = handle(rsc[cur])(handlers[cur] as any)
        return prev
      }, {} as any)
    )
    return handler as Effect<
      [THandlers[keyof THandlers]] extends [{ [EffectTypeId]: { _R: (_: never) => infer R } }] ? R : never,
      [THandlers[keyof THandlers]] extends [{ [EffectTypeId]: { _E: (_: never) => infer E } }] ? E : never,
      {
        [K in Keys]: ReqHandler<
          ReqFromSchema<GetRequest<Rsc[K]>>,
          _R<GetHandler<Effect.Success<THandlers[K]>>>,
          _E<GetHandler<Effect.Success<THandlers[K]>>>,
          ResFromSchema<GetResponse<Rsc[K]>>,
          GetRequest<Rsc[K]>,
          GetResponse<Rsc[K]>,
          CTX
        >
      }
    >
  }

  return {
    matchWith,
    matchWithEffect,
    matchWithServices,
    controllers
  }
}

export * from "@effect-app/infra/api/routing"
