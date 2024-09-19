/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { Layer, Scope } from "effect-app"
import { Effect, Predicate, S } from "effect-app"
import type { SupportedErrors, ValidationError } from "effect-app/client/errors"
import type { Struct } from "effect-app/schema"
import { REST } from "effect-app/schema"
import { handleRequestEnv } from "./RequestEnv.js"
import type { GetContext, GetCTX } from "./RequestEnv.js"
import type {} from "resources/lib.js"
import { HttpRouter } from "effect-app/http"
import type { HttpServerRequest, HttpServerResponse } from "effect-app/http"
import type {} from "@effect/schema/ParseResult"

type AnyRequestModule = { Request: any; Context: any; Response: any; failure: any }
export function match<
  R,
  M,
  PathA extends Struct.Fields,
  CookieA extends Struct.Fields,
  QueryA extends Struct.Fields,
  BodyA extends Struct.Fields,
  HeaderA extends Struct.Fields,
  ReqA extends PathA & QueryA & BodyA,
  ResA extends Struct.Fields,
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
    req: HttpServerRequest.HttpServerRequest,
    res: HttpServerResponse.HttpServerResponse,
    r2: Effect<HttpServerResponse.HttpServerResponse, ValidationError | MiddlewareE | ResE, R>
  ) => Effect<
    HttpServerResponse.HttpServerResponse,
    never,
    Exclude<RErr | R, HttpServerRequest.HttpServerRequest | HttpRouter.RouteContext | Scope>
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
  // const rdesc = yield* RouteDescriptors.flatMap((_) => _.get)

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
    handler.pipe(
      Effect.withSpan("Request." + requestHandler.name, { captureStackTrace: () => (requestHandler as any).stack })
    )
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
  type Res = S.Schema.Type<Extr<ResSchema>>

  return <R, E>(
    h: { _tag: "raw" | "d"; handler: (r: Req) => Effect<Res, E, R>; stack?: string }
  ) => ({
    adaptResponse,
    stack: h.stack,
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
  // TODO: specific failure
  // Err extends SupportedErrors | S.ParseResult.ParseError,
  PR = never
> // RErr = never,
 = HttpRouter.Route<never, Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>>

export interface Hint<Err extends string> {
  Err: Err
}

type HandleVoid<Expected, Actual, Result> = Expected extends void
  ? Actual extends void ? Result : Hint<"You're returning non void for a void Response, please fix">
  : Result

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
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
      >
    >

    <R2, E, A>(
      f: (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">
      ) => Effect<A, E, R2>
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
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
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: Compute<
          LowerServices<EffectDeps<SVC>> & GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">,
          "flat"
        >
      ) => Effect<A, E, R2>
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
      >
    >
  }

  type Keys = keyof Omit<Rsc, "meta">
  type Handler<Action extends AnyRequestModule, RT extends "raw" | "d", A, E, R> = {
    new(): {}
    _tag: RT
    handler: (
      req: Action["Request"],
      ctx: Action["Context"]
    ) => Effect<
      A,
      E,
      R
    >
  }

  type AHandler<Action extends AnyRequestModule> =
    | Handler<
      Action,
      "raw",
      ResRawFromSchema<REST.GetResponse<Action>>,
      SupportedErrors | S.ParseResult.ParseError | S.Schema.Type<Action["failure"]>,
      any
    >
    | Handler<
      Action,
      "d",
      ResFromSchema<REST.GetResponse<Action>>,
      SupportedErrors | S.ParseResult.ParseError | S.Schema.Type<Action["failure"]>,
      any
    >

  const controllers = <
    THandlers extends {
      // import to keep them separate via | for type checking!!
      [K in Keys]: AHandler<Rsc[K]>
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
        errorHandler(req),
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
      HttpRouter.Route<any, infer R>
    ] ? R
      : never

    type _ERoute<T extends HttpRouter.Route<any, any>> = [T] extends [
      HttpRouter.Route<infer E, any>
    ] ? E
      : never

    return HttpRouter.fromIterable(Object.values(mapped)) as HttpRouter.HttpRouter<
      _ERoute<typeof mapped[keyof typeof mapped]>,
      _RRoute<typeof mapped[keyof typeof mapped]>
    >
  }

  type ResRawFromSchema<ResSchema> = S.Schema.Encoded<Extr<ResSchema>>

  const r = {
    controllers,
    ...typedKeysOf(rsc).reduce(
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
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
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
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
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

export function matchForN<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  type Filtered = {
    [K in keyof Rsc as Rsc[K] extends { Response: any } ? K : never]: Rsc[K] extends { Response: any } ? Rsc[K]
      : never
  }
  const filtered = typedKeysOf(rsc).reduce((acc, cur) => {
    if (Predicate.isObject(rsc[cur]) && rsc[cur].Request) {
      acc[cur as keyof Filtered] = rsc[cur]
    }
    return acc
  }, {} as Filtered)

  const matchWithServices = <Key extends keyof Filtered>(action: Key) => {
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
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
      >
    >

    <R2, E, A>(
      f: (
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">
      ) => Effect<A, E, R2>
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
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
        req: ReqFromSchema<REST.GetRequest<Rsc[Key]>>,
        ctx: Compute<
          LowerServices<EffectDeps<SVC>> & GetCTX<REST.GetRequest<Rsc[Key]>> & Pick<Rsc[Key], "Response">,
          "flat"
        >
      ) => Effect<A, E, R2>
    ): HandleVoid<
      S.Schema.Type<REST.GetResponse<Rsc[Key]>>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2
      >
    >
  }

  type Keys = keyof Filtered
  type Handler<Action extends AnyRequestModule, RT extends "raw" | "d", A, E, R> = {
    _tag: RT
    handler: (
      req: Action["Request"],
      ctx: Action["Context"]
    ) => Effect<
      A,
      E,
      R
    >
  }

  type AHandler<Action extends AnyRequestModule> =
    | Handler<
      Action,
      "raw",
      ResRawFromSchema<REST.GetResponse<Action>>,
      SupportedErrors | S.ParseResult.ParseError | S.Schema.Type<Action["failure"]>,
      any
    >
    | Handler<
      Action,
      "d",
      ResFromSchema<REST.GetResponse<Action>>,
      SupportedErrors | S.ParseResult.ParseError | S.Schema.Type<Action["failure"]>,
      any
    >

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
        errorHandler(req),
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
      HttpRouter.Route<any, infer R>
    ] ? R
      : never

    type _ERoute<T extends HttpRouter.Route<any, any>> = [T] extends [
      HttpRouter.Route<infer E, any>
    ] ? E
      : never

    return HttpRouter.fromIterable(Object.values(mapped)) as HttpRouter.HttpRouter<
      _ERoute<typeof mapped[keyof typeof mapped]>,
      _RRoute<typeof mapped[keyof typeof mapped]>
    >
  }

  type ResRawFromSchema<ResSchema> = S.Schema.Encoded<Extr<ResSchema>>

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
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
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
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
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
          [Key in keyof Filtered]: MatchWithServicesNew<"d", Key>
        }
        & {
          // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
          [Key in keyof Filtered as Key extends string ? `${Key}Raw` : never]: MatchWithServicesNew<"raw", Key>
        }
    )
  }
  return r
}

export const errorHandler = (resourceRequest: { failure?: S.Schema.AnyNoContext }) => {
  return <R>(
    req: HttpServerRequest.HttpServerRequest,
    res: HttpServerResponse.HttpServerResponse,
    r2: Effect<HttpServerResponse.HttpServerResponse, SupportedErrors | JWTError | S.ParseResult.ParseError, R>
  ) => defaultErrorHandler(req, res, Effect.catchTag(r2, "ParseError", (_) => Effect.die(_)), resourceRequest.failure)
}

/**
 * Gather all handlers of a module and attach them to the Server.
 * If no `allowAnonymous` flag is on the Request, will require a valid authenticated user.
 */

export function matchAll<T extends RequestHandlersTest>(handlers: T) {
  const r = typedKeysOf(handlers).reduce((acc, cur) => {
    return HttpRouter.concat(acc, handlers[cur] as any)
  }, HttpRouter.empty)

  type _RRouter<T extends HttpRouter.HttpRouter<any, any>> = [T] extends [
    HttpRouter.HttpRouter<infer R, any>
  ] ? R
    : never

  type _ERouter<T extends HttpRouter.HttpRouter<any, any>> = [T] extends [
    HttpRouter.HttpRouter<any, infer E>
  ] ? E
    : never

  return r as HttpRouter.HttpRouter<
    _ERouter<typeof handlers[keyof typeof handlers]>,
    _RRouter<typeof handlers[keyof typeof handlers]>
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
  [key: string]: HttpRouter.HttpRouter<any, any>
}
