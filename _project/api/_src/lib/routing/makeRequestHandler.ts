/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import type { EnforceNonEmptyRecord } from "@effect-app/core/utils"
import { pretty } from "@effect-app/core/utils"

import { RequestContext } from "@effect-app/infra/RequestContext"
import { extractSchema, SchemaNamed } from "@effect-app/prelude/schema"

import { snipString } from "@effect-app/infra/api/util"
import { reportError } from "@effect-app/infra/errorReporter"
import type { ValidationError } from "@effect-app/infra/errors"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import type { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { RequestId } from "@effect-app/prelude/ids"
import type { HttpRequestError } from "../http.js"
import { HttpBody, HttpRouteContext, HttpServerRequest, HttpServerResponse } from "../http.js"
import { makeRequestParsers, parseRequestParams } from "./base.js"
import type { RequestHandler, RequestHandlerBase } from "./RequestEnv.js"

export const RequestSettings = FiberRef.unsafeMake({
  verbose: false
})

export type MakeMiddlewareContext<ResE, R2 = never, PR = never> = Effect<
  R2 | RequestContextContainer | ContextMapContainer,
  ResE,
  Context<PR>
>

export type Middleware<
  R,
  M,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE,
  MiddlewareE,
  PPath extends `/${string}`,
  R2 = never,
  PR = never
> = (
  handler: RequestHandler<R, M, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, ResE, PPath>
) => {
  handler: RequestHandler<
    Exclude<R2, HttpServerRequest> | PR | RequestContextContainer | ContextMapContainer,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    ResE,
    PPath
  >
  makeContext: MakeMiddlewareContext<MiddlewareE, R2, PR>
}

export function makeRequestHandler<
  R,
  M,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE,
  MiddlewareE,
  R2,
  PR,
  RErr,
  PPath extends `/${string}`
>(
  handler: RequestHandlerBase<
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
    PPath
  >,
  errorHandler: <R>(
    req: HttpServerRequest,
    res: HttpServerResponse,
    r2: Effect<R, ValidationError | ResE | MiddlewareE, HttpServerResponse>
  ) => Effect<RErr | R | RequestContextContainer | ContextMapContainer, never, HttpServerResponse>,
  makeMiddlewareContext?: MakeMiddlewareContext<MiddlewareE, R2, PR>
): Effect<
  | HttpRouteContext
  | HttpServerRequest
  | RequestContextContainer
  | ContextMapContainer
  | RErr
  | Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>
  | R2,
  HttpRequestError,
  HttpServerResponse
> {
  const { Request, Response, h: handle } = handler

  const response = Response ? extractSchema(Response) : Void
  const encoder = Encoder.for(response as any)
  // const encodeResponse = adaptResponse
  //   ? (req: ReqA) => Encoder.for(adaptResponse(req))
  //   : () => encoder

  const requestParsers = makeRequestParsers(Request)
  const parseRequest = parseRequestParams(requestParsers)

  const getParams = Effect
    .all({
      rcx: HttpRouteContext,
      req: HttpServerRequest.flatMap((req) => req.json.map((body) => ({ body, headers: req.headers })))
    })
    .map((
      { rcx, req }
    ) => ({
      params: rcx.params,
      query: rcx.searchParams,
      body: req.body,
      headers: req.headers,
      cookies: {} // req.cookies
    }))

  return Effect.gen(function*($) {
    const req = yield* $(HttpServerRequest)
    let res = HttpServerResponse.empty()

    const currentSpan = yield* $(Effect.currentSpan.map((_) => _.value))
    const parent = currentSpan?.parent ? currentSpan.parent.value : undefined
    const start = new Date()
    const supported = ["en", "de"] as const
    const desiredLocale = req.headers["x-locale"]
    const locale = desiredLocale && supported.includes(desiredLocale as any)
      ? (desiredLocale as typeof supported[number])
      : ("en" as const)

    // const context = getAppInsightsContext()
    // if (!context) {
    //   throw new Error("AI Context missing")
    // }

    const requestId = req.headers["request-id"]
    const rootId = parent?.spanId
      ? RequestId(parent.spanId)
      : requestId
      ? RequestId.parseSync(requestId)
      : RequestId.make()

    const storeId = req.headers["x-store-id"]
    const namespace = NonEmptyString255((storeId && (Array.isArray(storeId) ? storeId[0] : storeId)) || "primary")

    const requestContext = new RequestContext({
      id: currentSpan?.spanId ? RequestId(currentSpan.spanId) : RequestId.make(),
      rootId,
      name: NonEmptyString255(
        Request.Model instanceof SchemaNamed ? Request.Model.name : Request.name
      ),
      locale,
      createdAt: start,
      namespace
      // ...(context.operation.parentId
      //   ? {
      //     parent: new RequestContextParent({
      //       id: RequestId(context.operation.parentId),
      //       locale,
      //       name: NonEmptyString255("API Request")
      //     })
      //   }
      //   : {})
    })
    const rcc = yield* $(RequestContextContainer)
    //
    res = res
      .setHeaders({ "request-id": requestContext.rootId, "Content-Language": requestContext.locale })
      .pipe((_) => req.method === "GET" ? _.setHeader("Cache-Control", "no-store") : _)

    const pars = yield* $(getParams)

    const eff = RequestSettings
      .get
      .flatMap((s) =>
        // TODO: we don;t have access to user id here cause context is not yet created
        Effect
          .logInfo("Incoming request")
          .annotateLogs({
            method: req.method,
            path: req.originalUrl,
            ...s.verbose
              ? {
                reqPath: pars.params.$$.pretty,
                reqQuery: pars.query.$$.pretty,
                reqBody: pretty(pars.body),
                reqCookies: pretty(pars.cookies),
                reqHeaders: pars.headers.$$.pretty
              }
              : undefined
          })
      )
      .andThen(
        Effect.suspend(() => {
          const handleRequest = parseRequest(pars)
            .map(({ body, path, query }) => {
              const hn = {
                ...body.value,
                ...query.value,
                ...path.value
              } as unknown as ReqA
              return hn
            })
            .flatMap((parsedReq) =>
              handle(parsedReq as any)
                .provideService(handler.Request.Tag, parsedReq as any)
                .map(encoder)
                .map((r) =>
                  res
                    .setBody(HttpBody.unsafeJson(r))
                    .setStatus(r === undefined ? 204 : 200)
                )
            ) as Effect<
              Exclude<R, EnforceNonEmptyRecord<M>>,
              ValidationError | ResE,
              HttpServerResponse
            >

          // Commands should not be interruptable.
          const r = req.method !== "GET" ? handleRequest.uninterruptible : handleRequest // .instrument("Performance.RequestResponse")
          const r2 = makeMiddlewareContext
            ? makeMiddlewareContext.andThen((ctx) => r.provide(ctx))
            // PR is not relevant here
            : (r as Effect<
              Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>,
              ResE | MiddlewareE | ValidationError,
              HttpServerResponse
            >)
          return errorHandler(
            req,
            res,
            r2
          )
        })
      )
      .catchAllCause((cause) =>
        Effect
          .sync(() => res.setStatus(500))
          .tap((res) =>
            Effect
              .all([
                rcc
                  .requestContext
                  .flatMap((requestContext) =>
                    reportError("request")(cause, {
                      requestContext,
                      path: req.originalUrl,
                      method: req.method
                    })
                  ),
                Effect.suspend(() => {
                  const headers = res.headers
                  return Effect
                    .logError("Finished request", cause)
                    .annotateLogs({
                      method: req.method,
                      path: req.originalUrl,
                      statusCode: res.status.toString(),

                      reqPath: pars.params.$$.pretty,
                      reqQuery: pars.query.$$.pretty,
                      reqBody: pretty(pars.body),
                      reqCookies: pretty(pars.cookies),
                      reqHeaders: pars.headers.$$.pretty,

                      resHeaders: Object
                        .entries(headers)
                        .reduce((prev, [key, value]) => {
                          prev[key] = value && typeof value === "string" ? snipString(value) : value
                          return prev
                        }, {} as Record<string, any>)
                        .$$
                        .pretty
                    })
                })
              ], { concurrency: "inherit" })
          )
          .tapErrorCause((cause) => Effect(console.error("Error occurred while reporting error", cause)))
      )
      .tap(RequestSettings
        .get
        .flatMap((s) => {
          const headers = res.headers
          return Effect
            .logInfo("Finished request")
            .annotateLogs({
              method: req.method,
              path: req.originalUrl,
              statusCode: res.status.toString(),
              ...s.verbose
                ? {
                  resHeaders: headers.$$.pretty
                }
                : undefined
            })
        }))
      .setupRequestContext(requestContext)

    return yield* $(eff)
  })
}
