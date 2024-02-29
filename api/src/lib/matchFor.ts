/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { EffectUnunified, LowerServices, ValuesE, ValuesR } from "@effect-app/core/Effect"
import { allLower } from "@effect-app/core/Effect"
import { type Compute, typedKeysOf } from "@effect-app/core/utils"
import type {
  _E,
  _R,
  EffectDeps,
  Extr,
  Flatten,
  JWTError,
  ReqFromSchema,
  ReqHandler,
  RequestHandler,
  ResFromSchema,
  RouteMatch
} from "@effect-app/infra/api/routing"
import { defaultErrorHandler, match } from "@effect-app/infra/api/routing"
import { Effect, S } from "effect-app"
import type { SupportedErrors } from "effect-app/client/errors"
import { REST } from "effect-app/schema"
import { handleRequestEnv } from "./RequestEnv.js"
import type { CTX, GetContext, GetCTX, RequestEnv } from "./RequestEnv.js"
import type {} from "resources/lib.js"
import type { HttpServerRequest, HttpServerResponse } from "effect-app/http"
import type {} from "@effect/schema/ParseResult"

function handle<
  TModule extends Record<
    string,
    any
  >
>(
  _: TModule & { ResponseOpenApi?: any },
  name: string,
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

  return <R, E, RT extends "raw" | "d">(
    h: AWithHandler<RT, (r: Req) => Effect<Res, E, R>>
  ) => ({
    adaptResponse,
    h: h.handler,
    name,
    Request,
    Response,
    ResponseOpenApi: _.ResponseOpenApi ?? Response,
    Context: null as any,
    CTX: null as any,
    rt: h._tag
  } as ReqHandler<
    Req,
    R,
    E,
    Res,
    ReqSchema,
    ResSchema,
    RT,
    GetCTX<Req>,
    GetContext<Req>
  >)
}
type AWithHandler<T extends "raw" | "d", handler> = {
  _tag: T
  handler: handler
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
      E,
      A
    >(
      services: SVC,
      f: (
        req: Req,
        ctx: Compute<
          LowerServices<EffectDeps<SVC>> & GetCTX<Req>,
          "flat"
        >
      ) => Effect<A, E, R2>
    ) =>
    (req: any, ctx: any) =>
      allLower(services)
        .andThen((svc2) => f(req, { ...ctx, ...svc2 as any, Response: rsc[action].Response }))
  }

  type MatchWithServicesNew<RT extends "raw" | "d", Key extends keyof Rsc> = {
    <R2, E, A>(
      f: Effect<A, E, R2>
    ): AWithHandler<
      RT,
      (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>>
      ) => Effect<A, E, R2>
    >
    <R2, E, A>(
      f: (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">
      ) => Effect<A, E, R2>
    ): AWithHandler<
      RT,
      (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>>
      ) => Effect<A, E, R2>
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
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: Compute<
          LowerServices<EffectDeps<SVC>> & GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">,
          "flat"
        >
      ) => Effect<A, E, R2>
    ): AWithHandler<
      RT,
      (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>>
      ) => Effect<A, E | ValuesE<EffectDeps<SVC>>, ValuesR<EffectDeps<SVC>> | R2>
    >
  }

  type Keys = keyof Omit<Rsc, "meta">

  type Handler<K extends keyof Rsc, RT extends "raw" | "d", R, Context extends CTX> = (
    req: ReqFromSchema<REST.GetRequest<Rsc[K]>>,
    ctx: Context
  ) => Effect<
    RT extends "raw" ? ResRawFromSchema<REST.GetResponse<Rsc[K]>> : ResFromSchema<REST.GetResponse<Rsc[K]>>,
    SupportedErrors | S.ParseResult.ParseError,
    R
  >

  const controllers = <
    THandlers extends {
      [K in Keys]: AWithHandler<"raw", Handler<K, "raw", any, any>> | AWithHandler<"d", Handler<K, "d", any, any>>
    }
  >(
    controllers: THandlers
  ) => {
    const handler = typedKeysOf(rsc).reduce((prev, cur) => {
      if (cur === "meta") return prev
      const m = (rsc as any).meta as { moduleName: string }
      if (!m) throw new Error("Resource has no meta specified")

      prev[cur] = handle(rsc[cur], m.moduleName + "." + (cur as string))(
        controllers[cur as keyof typeof controllers] as any
      )
      return prev
    }, {} as any)

    return handler as {
      [K in Keys]: ReqHandler<
        ReqFromSchema<REST.GetRequest<Rsc[K]>>,
        _R<ReturnType<THandlers[K]["handler"]>>,
        _E<ReturnType<THandlers[K]["handler"]>>,
        ResFromSchema<REST.GetResponse<Rsc[K]>>,
        REST.GetRequest<Rsc[K]>,
        REST.GetResponse<Rsc[K]>,
        THandlers[K]["_tag"],
        GetCTX<REST.GetRequest<Rsc[K]>>,
        GetContext<REST.GetRequest<Rsc[K]>>
      >
    }
  }

  type ResRawFromSchema<ResSchema> = S.Schema.From<Extr<ResSchema>>

  const r = {
    controllers,
    ...typedKeysOf(rsc).reduce(
      (prev, cur) => {
        ;(prev as any)[cur] = (svcOrFnOrEffect: any, fnOrNone: any) =>
          Effect.isEffect(svcOrFnOrEffect)
            ? { _tag: "d", handler: () => svcOrFnOrEffect }
            : typeof svcOrFnOrEffect === "function"
            ? {
              _tag: "d",
              handler: (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
            }
            : { _tag: "d", handler: matchWithServices(cur)(svcOrFnOrEffect, fnOrNone) }
        ;(prev as any)[(cur as any) + "Raw"] = (svcOrFnOrEffect: any, fnOrNone: any) =>
          Effect.isEffect(svcOrFnOrEffect)
            ? { _tag: "raw", handler: () => svcOrFnOrEffect }
            : typeof svcOrFnOrEffect === "function"
            ? {
              _tag: "raw",
              handler: (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
            }
            : { _tag: "raw", handler: matchWithServices(cur)(svcOrFnOrEffect, fnOrNone) }
        return prev
      },
      {} as
        & {
          // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
          [Key in keyof Rsc as Key extends "meta" ? never : Key]: MatchWithServicesNew<"d", Key>
        }
        & {
          // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
          [Key in keyof Rsc as Key extends "meta" ? never : Key extends string ? `${Key}Raw` : never]:
            MatchWithServicesNew<"raw", Key>
        }
    )
  }
  return r
}

export function errorHandler<R>(
  req: HttpServerRequest.ServerRequest,
  res: HttpServerResponse.ServerResponse,
  r2: Effect<HttpServerResponse.ServerResponse, SupportedErrors | JWTError | S.ParseResult.ParseError, R>
) {
  return defaultErrorHandler(req, res, Effect.catchTag(r2, "ParseError", (_) => Effect.die(_)))
}

function _matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = typedKeysOf(handlers).reduce((prev, cur) => {
    const req = handlers[cur]!.Request

    class Request extends req {
      static path = "/" + handlers[cur]!.name + (req.path === "/" ? "" : req.path)
      static method = req.method === "AUTO" ? REST.determineMethod(handlers[cur]!.name.split(".")[1]!, req) : req.method
    }
    if (req.method === "AUTO") {
      Object.assign(Request, { [Request.method === "GET" || Request.method === "DELETE" ? "Query" : "Body"]: req.Auto })
    }
    Object.assign(handlers[cur], { Request })
    prev[cur] = match(
      handlers[cur]!,
      errorHandler,
      handleRequestEnv
    )
    return prev
  }, {} as any) as RouteAll<typeof handlers>

  return mapped
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAll<T extends RequestHandlersTest>(handlers: T) {
  const mapped = typedKeysOf(handlers).reduce((prev, cur) => {
    const matches = _matchAll(handlers[cur])
    typedKeysOf(matches).forEach((key) => prev[`${cur as string}.${key as string}`] = matches[key])
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
  SupportedErrors | S.ParseResult.ParseError,
  any,
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
    any,
    infer Context
  > // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ? RouteMatch<R, M, RequestEnv | Context>
    : never
}

type RouteAllNested<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAll<T[K]>
}
