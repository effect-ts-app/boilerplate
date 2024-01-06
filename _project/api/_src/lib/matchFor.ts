/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { Compute } from "@effect-app/core/utils"
import type {
  _E,
  _R,
  EffectDeps,
  Extr,
  Flatten,
  ReqFromSchema,
  ReqHandler,
  RequestHandler,
  ResFromSchema,
  RouteMatch
} from "@effect-app/infra/api/routing"
import { defaultErrorHandler, match } from "@effect-app/infra/api/routing"
import type { EffectUnunified, LowerServices, ValuesE, ValuesR } from "@effect-app/prelude/_ext/allLower"
import { allLower_ } from "@effect-app/prelude/_ext/allLower"
import type { SupportedErrors } from "@effect-app/prelude/client/errors"
import type { REST } from "@effect-app/schema"
import { handleRequestEnv } from "./RequestEnv.js"
import type { CTX, GetContext, GetCTX, RequestEnv } from "./RequestEnv.js"

function handle<
  TModule extends Record<
    string,
    any
  >
>(
  _: TModule & { ResponseOpenApi?: any },
  adaptResponse?: any
) {
  const Request = S.REST.extractRequest(_)
  const Response = S.REST.extractResponse(_)

  type ReqSchema = S.REST.GetRequest<TModule>
  type ResSchema = S.REST.GetResponse<TModule>
  type Req = InstanceType<
    ReqSchema extends { new(...args: any[]): any } ? ReqSchema
      : never
  >
  type Res = S.Schema.To<Extr<ResSchema>>

  return <R, E>(
    h: (r: Req) => Effect<R, E, Res>
  ) => ({
    adaptResponse,
    h,
    Request,
    Response,
    ResponseOpenApi: _.ResponseOpenApi ?? Response,
    Context: null as any,
    CTX: null as any
  } as ReqHandler<
    Req,
    R,
    E,
    Res,
    ReqSchema,
    ResSchema,
    GetCTX<Req>,
    GetContext<Req>
  >)
}

export function matchFor<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  const matchWithServices = <Key extends keyof Rsc>(_action: Key) => {
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
    (req: any, ctx: any) =>
      allLower_(services)
        .flatMap((svc2) => f(req, { ...ctx, ...svc2 as any }))
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
  ) => (
    req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
    ctx: GetCTX<REST.GetRequest<Rsc[Key]>>
  ) => Effect<
    ValuesR<EffectDeps<SVC>> | R2,
    E | ValuesE<EffectDeps<SVC>>,
    ResFromSchema<REST.GetResponse<Rsc[Key]>>
  >

  type Keys = keyof Rsc

  type Handler<K extends keyof Rsc, R, Context extends CTX> = (
    req: ReqFromSchema<REST.GetRequest<Rsc[K]>>,
    ctx: Context
  ) => Effect<R, SupportedErrors, ResFromSchema<REST.GetResponse<Rsc[K]>>>

  const controllers = <
    THandlers extends {
      [K in Keys]: Handler<K, any, any>
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
        GetCTX<REST.GetRequest<Rsc[K]>>,
        GetContext<REST.GetRequest<Rsc[K]>>
      >
    }
  }

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

function _matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    prev[cur] = match(handlers[cur]!, defaultErrorHandler, handleRequestEnv)
    return prev
  }, {} as any) as RouteAll<typeof handlers>

  return mapped
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAll<T extends RequestHandlersTest>(handlers: T) {
  const mapped = handlers.$$.keys.reduce((prev, cur) => {
    const matches = _matchAll(handlers[cur])
    matches.$$.keys.forEach((key) => prev[`${cur as string}.${key as string}`] = matches[key])
    return prev
  }, {} as any) as Flatten<RouteAllNested<typeof handlers>>

  return mapped
}

export type SupportedRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  SupportedErrors,
  any,
  any,
  any,
  any
>

export type RequestHandlers = { [key: string]: SupportedRequestHandler }
export type RequestHandlersTest = {
  [key: string]: Record<string, SupportedRequestHandler>
}

type RouteAll<T extends RequestHandlers> = {
  [K in keyof T]: T[K] extends ReqHandler<
    infer M,
    infer R,
    SupportedErrors, // infer ResE,
    any,
    any,
    any,
    any,
    infer Context
  > ? RouteMatch<R, M, RequestEnv | Context>
    : never
}

type RouteAllNested<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAll<T[K]>
}
