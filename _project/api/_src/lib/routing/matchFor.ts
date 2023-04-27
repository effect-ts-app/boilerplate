/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { Compute } from "@effect-app/core/utils"
import type { SupportedErrors } from "@effect-app/infra/api/defaultErrorHandler"
import type { _E, _R } from "@effect-app/infra/api/express/schema/requestHandler"
import type { ReqFromSchema, ReqHandler, ResFromSchema } from "@effect-app/infra/api/routing"
import { handle } from "@effect-app/infra/api/routing"
import {
  allLowerFirst_,
  type LowerServices,
  type Values,
  type ValuesE,
  type ValuesR
} from "@effect-app/prelude/_ext/allLowerFirst"
import { allLowerFirstWith_ } from "@effect-app/prelude/_ext/allLowerFirst"
import type { GetRequest, GetResponse } from "@effect-app/prelude/schema"
import { type EffectTypeId } from "@effect/io/Effect"
import type { CTX } from "./ctx.js"

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
      prev[cur] = handle(mod[cur])(handlers[cur as keyof typeof handlers] as any)
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

export const matchAction = <Module extends Record<string, any>, R, R2, E, E2 extends SupportedErrors>(
  _: Module,
  f: Effect<
    R,
    E,
    (
      req: ReqFromSchema<GetRequest<Module>>,
      ctx: CTX
    ) => Effect<R2, E2, ResFromSchema<GetResponse<Module>>>
  >
) => f

export function matchFor<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  const matchWithServices_ = <
    Key extends keyof Rsc,
    SVC extends Record<string, Tag<any, any> | Effect<any, any, any>>,
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
      Effect.context<Values<SVC>>().flatMap((context) =>
        allLowerFirstWith_(services, (svc) => (req, ctx) =>
          f(req, { ...ctx, ...svc as any }).provideSomeContextReal(context))
      )
    )

  const matchWithServices2_ = <
    Key extends keyof Rsc,
    SVC extends Record<string, Tag<any, any> | Effect<any, any, any>>,
    SVC2 extends Record<string, Tag<any, any> | Effect<any, any, any>>,
    R2,
    E extends SupportedErrors
  >(
    action: Key,
    services: SVC,
    fctx: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: Compute<LowerServices<SVC> & CTX, "flat">
    ) => SVC2,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: Compute<LowerServices<SVC> & LowerServices<SVC2> & CTX, "flat">
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) =>
    matchAction(
      rsc[action],
      Effect.context<Values<SVC>>().flatMap((context) =>
        allLowerFirstWith_(services, (svc) => (req: any, ctx: any) =>
          Effect
            .context<Values<SVC2>>()
            .flatMap((context2) =>
              allLowerFirst_(fctx(req, { ...ctx, ...svc as any }))
                .flatMap((svc2) =>
                  f(req, { ...ctx, ...svc as any, ...svc2 as any })
                    .provideSomeContextReal(context2)
                )
            ))
          .provideSomeContextReal(context)
      )
    )

  type MatchWithServices<Key extends keyof Rsc> = <
    SVC extends Record<string, Tag<any, any> | Effect<any, any, any>>,
    R2,
    E extends SupportedErrors
  >(
    services: SVC,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: Compute<LowerServices<SVC> & CTX, "flat">
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) => Effect<
    ValuesR<SVC>,
    ValuesE<SVC>,
    (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<Exclude<R2, Values<SVC>>, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  >

  const matchWithServices: <Key extends keyof Rsc>(
    action: Key
  ) => MatchFn<Key> = (action) => {
    return (...args: any[]): any => {
      if (args.length === 1) {
        return typeof args[0] === "function" ? matchWith_(action, args[0]) : matchWithEffect_(action, args[0])
      } else if (args.length === 2) {
        return matchWithServices_(action, ...args as [any, any])
      } else {
        return matchWithServices2_(action, args[0], typeof args[1] === "function" ? args[1] : () => args[1], args[2])
      }
    }
  }

  type MatchWithServices2<Key extends keyof Rsc> = {
    <
      SVC extends Record<string, Effect<any, any, any> | Tag<any, any>>,
      SVC2 extends Record<string, Effect<any, any, any> | Tag<any, any>>,
      R2,
      E extends SupportedErrors
    >(
      services: SVC,
      fctx: SVC2,
      f: (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: Compute<LowerServices<SVC> & LowerServices<SVC2> & CTX, "flat">
      ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
    ): Effect<
      ValuesR<SVC>,
      ValuesE<SVC>,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: CTX
      ) => Effect<
        ValuesR<SVC2> | Exclude<R2, Values<SVC>>,
        E | ValuesE<SVC2>,
        ResFromSchema<GetResponse<Rsc[Key]>>
      >
    >
    <
      SVC extends Record<string, Effect<any, any, any> | Tag<any, any>>,
      SVC2 extends Record<string, Effect<any, any, any> | Tag<any, any>>,
      R2,
      E extends SupportedErrors
    >(
      services: SVC,
      fctx: (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: Compute<LowerServices<SVC> & CTX, "flat">
      ) => SVC2,
      f: (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: Compute<LowerServices<SVC> & LowerServices<SVC2> & CTX, "flat">
      ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
    ): Effect<
      ValuesR<SVC>,
      ValuesE<SVC>,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: CTX
      ) => Effect<
        ValuesR<SVC2> | Exclude<R2, Values<SVC>>,
        E | ValuesE<SVC2>,
        ResFromSchema<GetResponse<Rsc[Key]>>
      >
    >
  }

  type MatchWithEffect<Key extends keyof Rsc> = <R, R2, E, E2 extends SupportedErrors>(
    f: Effect<
      R,
      E,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: CTX
      ) => Effect<R2, E2, ResFromSchema<GetResponse<Rsc[Key]>>>
    >
  ) => Effect<
    R,
    E,
    (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E2, ResFromSchema<GetResponse<Rsc[Key]>>>
  >

  const matchWithEffect_ = <Key extends keyof Rsc, R, R2, E, E2 extends SupportedErrors>(
    action: Key,
    f: Effect<
      R,
      E,
      (
        req: ReqFromSchema<GetRequest<Rsc[Key]>>,
        ctx: CTX
      ) => Effect<R2, E2, ResFromSchema<GetResponse<Rsc[Key]>>>
    >
  ) => matchAction(rsc[action], f)

  const matchWith_ = <Key extends keyof Rsc, R2, E extends SupportedErrors>(
    action: Key,
    f: (
      req: ReqFromSchema<GetRequest<Rsc[Key]>>,
      ctx: CTX
    ) => Effect<R2, E, ResFromSchema<GetResponse<Rsc[Key]>>>
  ) => matchAction(rsc[action], Effect.sync(() => f))

  type MatchWith<Key extends keyof Rsc> = <R2, E extends SupportedErrors>(
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
  >

  type MatchFn<Key extends keyof Rsc> =
    & MatchWithServices<Key>
    & MatchWithServices2<Key>
    & MatchWith<Key>
    & MatchWithEffect<Key>

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
    const handler = Effect.all(controllers).map((handlers) =>
      rsc.$$.keys.reduce((prev, cur) => {
        prev[cur] = handle(rsc[cur])(handlers[cur as keyof typeof handlers] as any)
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

  // TODO: overloads for match vs matchWith vs matchWithServices
  const r = {
    controllers,
    ...rsc.$$.keys.reduce(
      (prev, cur) => {
        ;(prev as any)[`match${cur as any}`] = matchWithServices(cur)
        return prev
      },
      {} as {
        // @ts-expect-error bla
        [Key in Keys as `match${Key}`]: MatchFn<Key>
      }
    )
  }
  return r
}
