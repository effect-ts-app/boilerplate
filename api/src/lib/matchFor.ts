/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { EffectUnunified, LowerServices } from "@effect-app/core/Effect"
import { allLower } from "@effect-app/core/Effect"
import { typedKeysOf } from "@effect-app/core/utils"
import type { Compute, EnforceNonEmptyRecord } from "@effect-app/core/utils"
import type {
  _E,
  _R,
  EffectDeps,
  Extr,
  JWTError,
  Middleware,
  ReqFromSchema,
  ReqHandler,
  RequestHandler,
  ResFromSchema
} from "@effect-app/infra/api/routing"
import { defaultErrorHandler, makeRequestHandler } from "@effect-app/infra/api/routing"
import type { Layer, Scope, Types } from "effect-app"
import { Effect, S } from "effect-app"
import type { SupportedErrors, ValidationError } from "effect-app/client/errors"
import type { StructFields } from "effect-app/schema"
import { REST } from "effect-app/schema"
import { handleRequestEnv } from "./RequestEnv.js"
import type { GetContext, GetCTX } from "./RequestEnv.js"
import type {} from "resources/lib.js"
import { HttpRouter } from "effect-app/http"
import type { HttpServerRequest, HttpServerResponse } from "effect-app/http"
import type {} from "@effect/schema/ParseResult"

export function match<
  R,
  M,
  PathA extends StructFields,
  CookieA extends StructFields,
  QueryA extends StructFields,
  BodyA extends StructFields,
  HeaderA extends StructFields,
  ReqA extends PathA & QueryA & BodyA,
  ResA extends StructFields,
  ResE,
  MiddlewareE,
  PPath extends `/${string}`,
  R2,
  PR,
  RErr,
  CTX,
  Context,
  Config
>(
  requestHandler: RequestHandler<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    PPath,
    CTX,
    Context,
    Config
  >,
  errorHandler: <R>(
    req: HttpServerRequest.ServerRequest,
    res: HttpServerResponse.ServerResponse,
    r2: Effect<HttpServerResponse.ServerResponse, ValidationError | MiddlewareE | ResE, R>
  ) => Effect<
    HttpServerResponse.ServerResponse,
    never,
    Exclude<RErr | R, HttpServerRequest.ServerRequest | HttpRouter.RouteContext | Scope>
  >,
  middleware?: Middleware<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    MiddlewareE,
    PPath,
    R2,
    PR,
    CTX,
    Context,
    Config
  >
) {
  let middlewareLayer: Layer<PR, MiddlewareE, R2> | undefined = undefined
  if (middleware) {
    const { handler, makeRequestLayer } = middleware(requestHandler)
    requestHandler = handler as any // todo
    middlewareLayer = makeRequestLayer
  }
  // const rdesc = yield* $(RouteDescriptors.flatMap((_) => _.get))

  const handler = makeRequestHandler<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    MiddlewareE,
    R2,
    PR,
    RErr,
    PPath,
    Config
  >(
    requestHandler as any, // one argument if no middleware, 2 if has middleware. TODO: clean this shit up
    errorHandler,
    middlewareLayer
  )

  const route = HttpRouter.makeRoute(
    requestHandler.Request.method,
    requestHandler.Request.path,
    handler
  )
  // TODO
  // rdesc.push(makeRouteDescriptor(
  //   requestHandler.Request.path,
  //   requestHandler.Request.method,
  //   requestHandler
  // ))
  return route
}

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

  return <R, E>(
    h: { _tag: "raw" | "d"; handler: (r: Req) => Effect<Res, E, R> }
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
    GetCTX<Req>,
    GetContext<Req>
  >)
}

export type RouteMatch<
  R,
  M,
  // TODO: specific errors
  // Err extends SupportedErrors | S.ParseResult.ParseError,
  PR = never
> // RErr = never,
 = HttpRouter.Route<Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>, never>

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
      Effect.andThen(allLower(services), (svc2) => f(req, { ...ctx, ...svc2 as any, Response: rsc[action].Response }))
  }

  type MatchWithServicesNew<RT extends "raw" | "d", Key extends keyof Rsc> = {
    <R2, E, A>(
      f: Effect<A, E, R2>
    ): Handler<
      ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
      Types.Simplify<GetCTX<REST.GetRequest<Rsc[Key]>>>,
      RT,
      A,
      E,
      R2
    >
    <R2, E, A>(
      f: (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">
      ) => Effect<A, E, R2>
    ): Handler<
      ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
      Types.Simplify<GetCTX<REST.GetRequest<Rsc[Key]>>>,
      RT,
      A,
      E,
      R2
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
    ): Handler<
      ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
      Types.Simplify<GetCTX<REST.GetRequest<Rsc[Key]>>>,
      RT,
      A,
      E,
      R2
    >
  }

  type Keys = keyof Omit<Rsc, "meta">
  type Handler<Req, Context, RT extends "raw" | "d", A, E, R> = {
    _tag: RT
    handler: (
      req: Req,
      ctx: Context
    ) => Effect<
      A,
      E,
      R
    >
  }

  const controllers = <
    THandlers extends {
      // import to keep them separate via | for type checking!!
      [K in Keys]:
        | Handler<
          ReqFromSchema<REST.GetRequest<Rsc[K]>>,
          GetCTX<REST.GetRequest<Rsc[K]>>,
          "raw",
          ResRawFromSchema<REST.GetResponse<Rsc[K]>>,
          SupportedErrors | S.ParseResult.ParseError,
          any
        >
        | Handler<
          ReqFromSchema<REST.GetRequest<Rsc[K]>>,
          GetCTX<REST.GetRequest<Rsc[K]>>,
          "d",
          ResFromSchema<REST.GetResponse<Rsc[K]>>,
          SupportedErrors | S.ParseResult.ParseError,
          any
        >
    }
  >(
    controllers: THandlers
  ) => {
    const handlers = typedKeysOf(rsc).reduce(
      (acc, cur) => {
        if (cur === "meta") return acc
        const m = (rsc as any).meta as { moduleName: string }
        if (!m) throw new Error("Resource has no meta specified")
        ;(acc as any)[cur] = handle(
          rsc[cur],
          m.moduleName + "." + (cur as string)
        )(controllers[cur as keyof typeof controllers] as any)
        return acc
      },
      {} as {
        [K in Keys]: ReqHandler<
          ReqFromSchema<REST.GetRequest<Rsc[K]>>,
          _R<ReturnType<THandlers[K]["handler"]>>,
          _E<ReturnType<THandlers[K]["handler"]>>,
          ResFromSchema<REST.GetResponse<Rsc[K]>>,
          REST.GetRequest<Rsc[K]>,
          REST.GetResponse<Rsc[K]>,
          GetCTX<REST.GetRequest<Rsc[K]>>,
          GetContext<REST.GetRequest<Rsc[K]>>
        >
      }
    )

    const mapped = typedKeysOf(handlers).reduce((acc, cur) => {
      const handler = handlers[cur]
      const req = handler.Request

      class Request extends (req as any) {
        static path = "/" + handler.name + (req.path === "/" ? "" : req.path)
        static method = req.method === "AUTO"
          ? REST.determineMethod(handler.name.split(".")[1]!, req)
          : req.method
      }
      if (req.method === "AUTO") {
        Object.assign(Request, {
          [Request.method === "GET" || Request.method === "DELETE" ? "Query" : "Body"]: req.Auto
        })
      }
      Object.assign(handler, { Request })
      acc[cur] = match(
        handler as any,
        errorHandler,
        handleRequestEnv as any // TODO
      )
      return acc
    }, {} as any) as {
      [K in Keys]: RouteMatch<
        _R<ReturnType<THandlers[K]["handler"]>>,
        ReqFromSchema<REST.GetRequest<Rsc[K]>>,
        //        _E<ReturnType<THandlers[K]["handler"]>>,
        GetContext<REST.GetRequest<Rsc[K]>>
      >
    }

    type _RRoute<T extends HttpRouter.Route<any, any>> = [T] extends [
      HttpRouter.Route<infer R, any>
    ] ? R
      : never

    type _ERoute<T extends HttpRouter.Route<any, any>> = [T] extends [
      HttpRouter.Route<any, infer E>
    ] ? E
      : never

    return HttpRouter.fromIterable(Object.values(mapped)) as HttpRouter.Router<
      _RRoute<typeof mapped[keyof typeof mapped]>,
      _ERoute<typeof mapped[keyof typeof mapped]>
    >
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

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAll<T extends RequestHandlersTest>(handlers: T) {
  const r = typedKeysOf(handlers).reduce((acc, cur) => {
    return HttpRouter.concat(acc, handlers[cur] as any)
  }, HttpRouter.empty)

  type _RRouter<T extends HttpRouter.Router<any, any>> = [T] extends [
    HttpRouter.Router<infer R, any>
  ] ? R
    : never

  type _ERouter<T extends HttpRouter.Router<any, any>> = [T] extends [
    HttpRouter.Router<any, infer E>
  ] ? E
    : never

  return r as HttpRouter.Router<
    _RRouter<typeof handlers[keyof typeof handlers]>,
    _ERouter<typeof handlers[keyof typeof handlers]>
  >
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
  any
>

export type RequestHandlers = { [key: string]: SupportedRequestHandler }
export type RequestHandlersTest = {
  [key: string]: HttpRouter.Router<any, any>
}
