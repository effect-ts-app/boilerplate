/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  InvalidStateError,
  NotFoundError,
  NotLoggedInError,
  OptimisticConcurrencyException,
  UnauthorizedError,
  ValidationError
} from "@/errors.js"
import { CauseException } from "@/errors.js"
import { RequestContext, RequestId } from "@/RequestContext.js"
import {
  Encoder,
  extractSchema,
  ReasonableString,
  SchemaNamed,
  StringId,
  Void
} from "@effect-ts-app/boilerplate-prelude/schema"
import * as MO from "@effect-ts-app/boilerplate-prelude/schema"
import { typedKeysOf } from "@effect-ts-app/core/utils"
import type {
  Middleware,
  RequestHandler,
  RequestHandlerOptRes
} from "@effect-ts-app/infra/express/schema/requestHandler"
import {
  makeRequestParsers,
  parseRequestParams,
  respondSuccess
} from "@effect-ts-app/infra/express/schema/requestHandler"
import type { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import { makeRouteDescriptor } from "@effect-ts-app/infra/express/schema/routing"
import { makeChild, WinstonInstance } from "@effect-ts-app/infra/logger/Winston"
import type { HasClock } from "@effect-ts/core/Effect/Clock"
import * as Ex from "@effect-ts/express"
import type { Erase } from "@effect-ts/system/Utils"
import type express from "express"
import type { StopWatch } from "stopwatch-node"
import { demandLoggedIn } from "./authorization.js"
import { reportError } from "./errorReporter.js"
import { Instrument } from "./instrument.js"
import { logger } from "./logger.js"

const optimisticConcurrencySchedule = Schedule.once["&&"](
  Schedule.recurWhile<SupportedErrors>(a => a._tag === "OptimisticConcurrencyException")
)
const retryOptimisticConcurrency = Effect.retry(optimisticConcurrencySchedule)

export type SupportedErrors =
  | ValidationError
  | NotFoundError
  | NotLoggedInError
  | UnauthorizedError
  | InvalidStateError
  | OptimisticConcurrencyException

export function match<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  R2 = unknown,
  PR = unknown
>(
  requestHandler: RequestHandler<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    SupportedErrors
  >,
  middleware?: Middleware<
    R,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    SupportedErrors,
    R2,
    PR
  >
) {
  let makeMiddlewareLayer = undefined
  if (middleware) {
    const { handle, handler } = middleware(requestHandler)
    requestHandler = handler
    makeMiddlewareLayer = handle
  }
  return Ex.match(requestHandler.Request.method.toLowerCase() as any)(
    requestHandler.Request.path.split("?")[0],
    makeRequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, R2, PR>(
      requestHandler,
      makeMiddlewareLayer
    )
  ).zipRight(
    Effect.succeedWith(() =>
      makeRouteDescriptor(
        requestHandler.Request.path,
        requestHandler.Request.method,
        requestHandler
      )
    )
  )
}

function snipValue(value: string | readonly string[] | undefined) {
  if (!value) {
    return value
  }
  return ImmutableArray.isArray(value)
    ? value.map(snipString)
    : typeof value === "string" && value.length > 50
    ? snipString(value)
    : value
}

function snipString(value: string) {
  return value.length > 255 ? value.slice(0, 255) + "...snip" : value
}

export class RequestException<E> extends CauseException<E> {
  constructor(cause: Cause<E>) {
    super(cause, "Request")
  }
}
const reportRequestError = reportError(cause => new RequestException(cause))

function getRequestPars(pars: RequestContext) {
  return {
    request: pars,
    requestId: pars.id,
    requestLocale: pars.locale,
    requestName: pars.name
  }
}

export const InternalRequestLayers = (pars: RequestContext) =>
  RequestContext.Live(pars)["<+<"](Layer.fromEffect(WinstonInstance)(makeChild(getRequestPars(pars))))

export function makeRequestHandler<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = unknown,
  PR = unknown
>(
  handler: RequestHandlerOptRes<
    R & PR,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    SupportedErrors
  >,
  makeMiddlewareLayer?: (
    req: express.Request,
    res: express.Response
  ) => Layer<R2, SupportedErrors, PR>
) {
  const { Request, Response, adaptResponse, h: handle } = handler
  const response = Response ? extractSchema(Response as any) : Void
  const encodeResponse = adaptResponse
    ? (req: ReqA) => Encoder.for(adaptResponse(req))
    : () => Encoder.for(response)

  const requestParsers = makeRequestParsers(Request)
  const parseRequest = parseRequestParams(requestParsers)
  const respond = respondSuccess(encodeResponse)
  return (req: express.Request, res: express.Response) => {
    const start = new Date()
    const supported = ["en", "de"] as const
    const desiredLocale = req.headers["x-locale"]
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store")
    }
    const locale = desiredLocale && supported.includes(desiredLocale as any)
      ? (desiredLocale as typeof supported[number])
      : ("en" as const)

    // const context = getAppInsightsContext()
    // if (!context) {
    //   throw new Error("AI Context missing")
    // }

    const requestContext = new RequestContext({
      rootId: RequestId(StringId.make()),
      name: ReasonableString(
        Request.Model instanceof SchemaNamed ? Request.Model.name : Request.name
      ),
      locale,
      createdAt: start
      // ...(context.operation.parentId
      //   ? {
      //     parent: new RequestContextParent({
      //       id: RequestId(context.operation.parentId),
      //       locale,
      //       name: ReasonableString("API Request")
      //     })
      //   }
      //   : {})
    })
    // context.requestContext = requestContext

    res.setHeader("Content-Language", locale)

    const handleRequest = Effect.succeedWith(() => ({
      path: req.params,
      query: req.query,
      body: req.body,
      headers: req.headers
        ? Object.entries(req.headers).reduce((prev, [key, value]) => {
          prev[key] = snipValue(value)
          return prev
        }, {} as Record<string, any>)
        : req.headers,
      cookies: req.cookies
        ? Object.entries(req.cookies).reduce((prev, [key, value]) => {
          prev[key] = typeof value === "string" || ImmutableArray.isArray(value)
            ? snipValue(value)
            : value
          return prev
        }, {} as Record<string, any>)
        : req.cookies
    }))
      .tap(pars =>
        logger.debug(
          `${start.toISOString()} ${req.method} ${req.originalUrl} processing request`,
          pars
        )
      )
      .zipRight(
        parseRequest(req)
          .map(({ body, path, query }) => {
            const hn = {
              ...body.value,
              ...query.value,
              ...path.value
            } as unknown as ReqA
            return hn
          })
          .inject(Instrument("Performance.ParseRequest"))
      )
      .flatMap(inp => {
        const handler = handle(inp as any) // TODO
        const handleRequest_: Effect<
          Effect.Erase<R & R2, PR>,
          SupportedErrors,
          ResA
        > = makeMiddlewareLayer
          ? handler.inject(makeMiddlewareLayer(req, res)) as any
          : (handler as any)

        const handleRequest = handleRequest_ // .inject(RequestLayers2)

        return (
          req.method === "PATCH"
            ? retryOptimisticConcurrency(handleRequest)
            : handleRequest
        )
          .inject(Instrument("Performance.HandleRequest"))
          .flatMap(r => respond(inp, res)(r).inject(Instrument("Performance.EncodeResponse")))
      })
      .catchTag("ValidationError", err =>
        Effect.succeedWith(() => {
          res.status(400).send(err.errors)
        }))
      .catchTag("NotFoundError", err =>
        Effect.succeedWith(() => {
          res.status(404).send(err)
        }))
      .catchTag("NotLoggedInError", err =>
        Effect.succeedWith(() => {
          res.status(401).send(err)
        }))
      .catchTag("UnauthorizedError", err =>
        Effect.succeedWith(() => {
          res.status(403).send(err)
        }))
      .catchTag("InvalidStateError", err =>
        Effect.succeedWith(() => {
          res.status(422).send(err)
        }))
      .catchTag("OptimisticConcurrencyException", err =>
        Effect.succeedWith(() => {
          // 412 or 409.. https://stackoverflow.com/questions/19122088/which-http-status-code-to-use-to-reject-a-put-due-to-optimistic-locking-failure
          res.status(412).send(err)
        }))
      // final catch all; expecting never so that unhandled known errors will show up
      .catchAll((err: never) =>
        logger
          .error(
            "Program error, compiler probably silenced, got an unsupported Error in Error Channel of Effect",
            { err }
          )
          .map(() => err as unknown)
          .flatMap(Effect.die)
      )
      .tapCause(cause =>
        Effect.succeedWith(() => {
          res.status(500).send()
          reportRequestError(cause, {
            requestContext,
            originalUrl: req.originalUrl,
            method: req.method
          })
        })
      )
      .tapBothInclAbort(
        () => {
          const headers = res.getHeaders()
          return logger.error(
            `${new Date().toISOString()} ${req.method} ${req.originalUrl} processed request`,
            {
              statusCode: res.statusCode,
              headers: headers
                ? Object.entries(headers).reduce((prev, [key, value]) => {
                  prev[key] = value && typeof value === "string" ? snipString(value) : value
                  return prev
                }, {} as Record<string, any>)
                : headers
            }
          )
        },
        () => {
          const headers = res.getHeaders()
          return logger.debug(
            `${new Date().toISOString()} ${req.method} ${req.originalUrl} processed request`,
            {
              statusCode: res.statusCode,
              headers: headers
                ? Object.entries(headers).reduce((prev, [key, value]) => {
                  prev[key] = value && typeof value === "string" ? snipString(value) : value
                  return prev
                }, {} as Record<string, any>)
                : headers
            }
          )
        }
      )
      .inject(InternalRequestLayers(requestContext))
    // Commands should not be interruptable.
    return (
      req.method !== "GET" ? Effect.uninterruptible(handleRequest) : handleRequest
    ).inject(Instrument("Performance.RequestResponse"))
  }
}

type RequestHandlers = { [key: string]: RequestHandler<any, any, any, any, any, any, any, any, any> }

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
    any // infer ResE
  > ? RouteMatch<
    R,
    /*PathA, CookieA,QueryA, BodyA, */ /*HeaderA, ReqA, ResA,*/ never, // Has<Config>,
    never // Has<UserProfile> & Has<LoggedInUserContext> /*, R2, PR*/
  >
    : never
}

type AppDeps =
  & Has<RequestContext>
  & Has<WinstonInstance>
  & Has<logger.Logger>
// & Has<CacheScope>
// & Has<BoilerplateContext>
// & Has<Config>
// & Has<AppInsightsContext>
// & Has<IntlInstance>
// & Has<AppInsights>
// & Has<Intl>

type RouteMatch<
  R,
  // PathA,
  // CookieA,
  // QueryA,
  // BodyA,
  // HeaderA,
  // ReqA extends PathA & QueryA & BodyA,
  // ResA,
  R2 = unknown,
  PR = unknown
> = Effect<
  & Has<Ex.ExpressAppConfig>
  & Has<Ex.ExpressApp>
  & Has<logger.Logger>
  & Erase<
    & R
    & R2,
    & PR
    & HasClock
    & AppDeps
    & {
      sw: StopWatch
    }
  >,
  never,
  RouteDescriptorAny // RouteDescriptor<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, SupportedErrors, Methods>
>

/**
 * TODO: This could probably be better done by a code generator, definitely would reduce the type system load.
 */
export function matchAll<T extends RequestHandlers>(handlers: T) {
  const mapped = typedKeysOf(handlers).reduce((prev, cur) => {
    prev[cur] = match(handlers[cur] as any, demandLoggedIn)
    return prev
  }, {} as any) as RouteAll<typeof handlers>

  return mapped
}

export function matchAllTest<T extends RequestHandlersTest>(handlers: T) {
  const mapped = typedKeysOf(handlers).reduce((prev, cur) => {
    const matches = matchAll(handlers[cur])
    typedKeysOf(matches).forEach(key => prev[`${cur as string}.${key as string}`] = matches[key])
    return prev
  }, {} as any) as Flatten<RouteAllTest<typeof handlers>>

  return mapped
}

type RequestHandlersTest = {
  [key: string]: Record<string, RequestHandler<any, any, any, any, any, any, any, any, any>>
}

type RouteAllTest<T extends RequestHandlersTest> = {
  [K in keyof T]: RouteAll<T[K]>
}

// type JoinObjects<T extends Record<string, Record<string, any>> = { [`${K in keyof T }`]: RouteAll<T[K]> }

type Flatten<T extends object> = object extends T ? object : {
  [K in keyof T]-?: (
    x: NonNullable<T[K]> extends infer V ? V extends object ? V extends readonly any[] ? Pick<T, K>
    : FlattenLVL1<V> extends infer FV ? ({
      [P in keyof FV as `${Extract<K, string | number>}.${Extract<P, string | number>}`]: FV[P]
    })
    : never
    : Pick<T, K>
      : never
  ) => void
} extends Record<keyof T, (y: infer O) => void> ? O extends unknown /* infer U */ ? { [K in keyof O]: O[K] } : never
: never

type FlattenLVL1<T extends object> = object extends T ? object : {
  [K in keyof T]-?: (
    x: NonNullable<T[K]> extends infer V ? V extends object ? V extends readonly any[] ? Pick<T, K>
    : /*: Flatten<V> extends infer FV ? ({
      [P in keyof FV as `${Extract<K, string | number>}.${Extract<P, string | number>}`]: FV[P]
    })
    : never
    */ Pick<T, K>
    : never
      : never
  ) => void
} extends Record<keyof T, (y: infer O) => void> ? O extends unknown /* infer U */ ? { [K in keyof O]: O[K] } : never
: never

export function handle<
  TModule extends Record<
    string,
    any // { Model: MO.SchemaAny; new (...args: any[]): any } | MO.SchemaAny
  >
>(
  _: TModule & { ResponseOpenApi?: any },
  adaptResponse?: any
) {
  // TODO: Prevent over providing // no strict/shrink yet.
  const Request = MO.extractRequest(_)
  const Response = MO.extractResponse(_)

  type ReqSchema = MO.GetRequest<TModule>
  type ResSchema = MO.GetResponse<TModule>
  type Req = InstanceType<
    ReqSchema extends { new(...args: any[]): any } ? ReqSchema
      : never
  >
  type Res = MO.ParsedShapeOf<Extr<ResSchema>>

  return <R, E>(
    h: (r: Req) => Effect<R, E, Res>
  ) => ({
    adaptResponse,
    h,
    Request,
    Response,
    ResponseOpenApi: _.ResponseOpenApi ?? Response
  } as ReqHandler<
    Req,
    R,
    E,
    Res,
    ReqSchema,
    ResSchema
  >)
}

export type Extr<T> = T extends { Model: MO.SchemaAny } ? T["Model"]
  : T extends MO.SchemaAny ? T
  : never

export interface ReqHandler<
  Req,
  R,
  E,
  Res,
  ReqSchema extends MO.SchemaAny,
  ResSchema extends MO.SchemaAny
> {
  h: (r: Req) => Effect<R, E, Res>
  Request: ReqSchema
  Response: ResSchema
  ResponseOpenApi: any
}
