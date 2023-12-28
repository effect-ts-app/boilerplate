/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { Compute } from "@effect-app/core/utils"
import type { EffectUnunified, LowerServices, ValuesE, ValuesR } from "@effect-app/prelude/_ext/allLower"
import { allLower_ } from "@effect-app/prelude/_ext/allLower"
import type { SupportedErrors } from "@effect-app/prelude/client/errors"
import { AST, REST } from "@effect-app/schema"
import { handle } from "./base.js"
import type { _E, _R, ReqFromSchema, ReqHandler, ResFromSchema } from "./base.js"
import type { CTX, GetCTX } from "./ctx.js"

export function matchResource<Rsc extends Record<string, Record<string, any>>>(mod: Rsc) {
  type Keys = keyof Rsc
  return <
    THandlers extends {
      [K in Keys]: (
        req: ReqFromSchema<REST.GetRequest<Rsc[K]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[K]>>
      ) => Effect<any, SupportedErrors, ResFromSchema<REST.GetResponse<Rsc[K]>>>
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
        ReqFromSchema<REST.GetRequest<Rsc[K]>>,
        _R<ReturnType<HNDLRS[K]>>,
        _E<ReturnType<HNDLRS[K]>>,
        ResFromSchema<REST.GetResponse<Rsc[K]>>,
        REST.GetRequest<Rsc[K]>,
        REST.GetResponse<Rsc[K]>,
        GetCTX<REST.GetRequest<Rsc[K]>>
      >
    }
  }
}

export const matchAction = <Module extends Record<string, any>, R2, E2 extends SupportedErrors>(
  mod: Module,
  f: (
    req: ReqFromSchema<REST.GetRequest<Module>>,
    ctx: GetCTX<REST.GetRequest<Module>>
  ) => Effect<R2, E2, ResFromSchema<REST.GetResponse<Module>>>
) => {
  const Request = REST.extractRequest(mod)
  const requestName = AST.getTitleAnnotation(Request.ast).value ?? "TODO"

  return Object.assign(f, { requestName })
}

export type EffectDeps<A> = {
  [K in keyof A as A[K] extends Effect<any, any, any> ? K : never]: A[K] extends Effect<any, any, any> ? A[K] : never
}

export function matchFor<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  const matchWithServices = <Key extends keyof Rsc>(action: Key) => {
    type Req = ReqFromSchema<REST.GetRequest<Rsc[Key]>>
    return <
      SVC extends Record<
        string,
        Effect<any, any, any>
      >,
      R2,
      E extends SupportedErrors
    >(
      services: SVC,
      f: (
        req: Req,
        ctx: Compute<
          LowerServices<EffectDeps<SVC>> & GetCTX<Req>,
          "flat"
        >
      ) => Effect<R2, E, ResFromSchema<REST.GetResponse<Rsc[Key]>>>
    ) =>
      matchAction(
        rsc[action],
        (req: any, ctx: any) =>
          // Effect
          //   .context<ReturnTypes<SVC>>()
          //   .flatMap((context2) =>
          allLower_(services)
            .flatMap((svc2) => f(req, { ...ctx, ...svc2 as any }) // .provide(context2)
              // )
            )
      )
    // )
  }

  type MatchWithServicesNew<Key extends keyof Rsc> = <
    SVC extends Record<
      string,
      EffectUnunified<any, any, any>
    >,
    R2,
    E extends SupportedErrors
  >(
    services: SVC,
    f: (
      req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
      ctx: Compute<
        LowerServices<EffectDeps<SVC>> & GetCTX<REST.GetRequest<Rsc[Key]>>,
        "flat"
      >
    ) => Effect<R2, E, ResFromSchema<REST.GetResponse<Rsc[Key]>>>
  ) =>
    & ((
      req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
      ctx: GetCTX<REST.GetRequest<Rsc[Key]>>
    ) => Effect<
      ValuesR<EffectDeps<SVC>> | R2,
      E | ValuesE<EffectDeps<SVC>>,
      ResFromSchema<REST.GetResponse<Rsc[Key]>>
    >)
    & { requestName: string }

  type Keys = keyof Rsc

  type Handler<K extends keyof Rsc, R, Context extends CTX> = (
    req: ReqFromSchema<REST.GetRequest<Rsc[K]>>,
    ctx: Context
  ) => Effect<R, SupportedErrors, ResFromSchema<REST.GetResponse<Rsc[K]>>>

  const controllers = <
    THandlers extends {
      [K in Keys]: Handler<K, any, any> & { requestName: string }
    }
  >(
    controllers: THandlers
  ) => {
    const handler = rsc.$$.keys.reduce((prev, cur) => {
      prev[cur] = handle(rsc[cur])(controllers[cur as keyof typeof controllers] as any)
      return prev
    }, {} as any)

    return handler as {
      [K in Keys]: ReqHandler<
        ReqFromSchema<REST.GetRequest<Rsc[K]>>,
        _R<ReturnType<THandlers[K]>>,
        _E<ReturnType<THandlers[K]>>,
        ResFromSchema<REST.GetResponse<Rsc[K]>>,
        REST.GetRequest<Rsc[K]>,
        REST.GetResponse<Rsc[K]>,
        GetCTX<REST.GetRequest<Rsc[K]>>
      >
    }
  }

  // TODO: overloads for match vs matchWith vs matchWithServices
  const r = {
    controllers,
    ...rsc.$$.keys.reduce(
      (prev, cur) => {
        ;(prev as any)[cur] = matchWithServices(cur)
        return prev
      },
      {} as {
        [Key in Keys]: MatchWithServicesNew<Key>
      }
    )
  }
  return r
}
