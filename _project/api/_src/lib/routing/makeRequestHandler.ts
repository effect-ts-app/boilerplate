/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { pretty } from "@effect-app/core/utils"
import type { RequestHandlerOptRes } from "@effect-app/infra/api/express/schema/requestHandler"
import { parseRequestParams } from "@effect-app/infra/api/express/schema/requestHandler"
import { makeRequestParsers, respondSuccess } from "@effect-app/infra/api/routing"
import type { ValidationError } from "@effect-app/infra/errors"
import { RequestContext, RequestId } from "@effect-app/infra/RequestContext"
import { extractSchema, SchemaNamed } from "@effect-app/prelude/schema"
import type express from "express"

import { reportRequestError } from "@effect-app/infra/api/reportError"
import { snipString } from "@effect-app/infra/api/util"
import {
  RequestContextContainer,
  RequestContextContainerImpl
} from "@effect-app/infra/services/RequestContextContainer"
import { restoreFromRequestContext } from "@effect-app/infra/services/Store/Memory"
import type { RequestHandler } from "../routing.js"

export const RequestSettings = FiberRef.unsafeMake({
  verbose: false
})

export type MakeMiddlewareContext<ResE, R2 = never, PR = never> = (
  req: express.Request,
  res: express.Response
) => Effect<R2 | RequestContextContainer, ResE, Context<PR>>

export type Middleware<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE,
  R2 = never,
  PR = never
> = (
  handler: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, ResE>
) => {
  handler: typeof handler
  makeContext: MakeMiddlewareContext<ResE, R2, PR>
}

export function makeRequestHandler<
  R,
  E,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA = void,
  R2 = never,
  PR = never,
  RErr = never
>(
  handler: RequestHandlerOptRes<
    R | PR,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    E
  >,
  errorHandler: <R>(
    req: express.Request,
    res: express.Response,
    r2: Effect<R, E | ValidationError, void>
  ) => Effect<RErr | R | RequestContextContainer, never, void>,
  makeMiddlewareContext?: MakeMiddlewareContext<E, R2, PR>,
  early?: (req: express.Request, res: express.Response) => Effect<RequestContextContainer, never, void>
): (
  req: express.Request,
  res: express.Response
) => Effect<Exclude<RErr | R | R2, RequestContextContainer>, never, void> {
  const { Request, Response, adaptResponse, h: handle } = handler
  const response = Response ? extractSchema(Response) : Void
  const encoder = Encoder.for(response as any)
  const encodeResponse = adaptResponse
    ? (req: ReqA) => Encoder.for(adaptResponse(req))
    : () => encoder

  const requestParsers = makeRequestParsers(Request)
  const parseRequest = parseRequestParams(requestParsers)
  const respond = respondSuccess(encodeResponse)

  function getParams(req: express.Request) {
    return Effect({
      path: req.params,
      query: req.query,
      body: req.body,
      headers: req.headers,
      cookies: req.cookies
    })
  }

  function makeContext(req: express.Request) {
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
    const rootId = requestId ? RequestId.parseUnsafe(requestId) : RequestId.make()

    const storeId = req.headers["x-store-id"]
    const namespace = ReasonableString((storeId && (Array.isArray(storeId) ? storeId[0] : storeId)) || "primary")

    const requestContext = new RequestContext({
      rootId,
      name: ReasonableString(
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
      //       name: ReasonableString("API Request")
      //     })
      //   }
      //   : {})
    })
    return requestContext
  }

  return (req: express.Request, res: express.Response) => {
    return Debug.untraced(restore =>
      Effect.all({
        requestContext: Effect.sync(() => {
          const requestContext = makeContext(req)
          if (req.method === "GET") {
            res.setHeader("Cache-Control", "no-store")
          }
          res.setHeader("Content-Language", requestContext.locale)
          return requestContext
        }),
        pars: getParams(req)
      })
        .flatMap(({ pars, requestContext }) =>
          (early ? early(req, res) : Effect.unit).zipRight(
            RequestSettings.get.flatMap(s =>
              // TODO: we don;t have access to user id here cause context is not yet created
              Effect.logInfo("Incoming request").apply(
                Effect.logAnnotates({
                  method: req.method,
                  path: req.originalUrl,
                  ...s.verbose
                    ? {
                      reqPath: pars.path.$$.pretty,
                      reqQuery: pars.query.$$.pretty,
                      reqBody: pretty(pars.body),
                      reqCookies: pretty(pars.cookies),
                      reqHeaders: pars.headers.$$.pretty
                    }
                    : undefined
                })
              )
            ).zipRight(
              Effect.suspend(() => {
                const handleRequest = parseRequest(req)
                  .map(({ body, path, query }) => {
                    const hn = {
                      ...body.value,
                      ...query.value,
                      ...path.value
                    } as unknown as ReqA
                    return hn
                  })
                  .flatMap(parsedReq =>
                    restore(() => handle(parsedReq as any))()
                      .flatMap(r => respond(parsedReq, res, r))
                  )

                // Commands should not be interruptable.
                const r = req.method !== "GET" ? handleRequest.uninterruptible : handleRequest // .instrument("Performance.RequestResponse")
                // the first log entry should be of the request start.
                const r2 = makeMiddlewareContext
                  ? restoreFromRequestContext
                    .zipRight(r.setupRequestFrom
                      // the db namespace must be restored, before calling provide here
                      .provideSomeContextEffect(makeMiddlewareContext(req, res)))
                  : restoreFromRequestContext
                    // PR is not relevant here
                    .zipRight(r) as Effect<R, E | ValidationError, void>
                return errorHandler(
                  req,
                  res,
                  r2
                )
              })
            )
              .tapErrorCause(cause =>
                Effect.allPar(
                  Effect(res.status(500).send()),
                  RequestContextContainer.get.flatMap(requestContext =>
                    reportRequestError(cause, {
                      requestContext,
                      path: req.originalUrl,
                      method: req.method
                    })
                  ),
                  Effect.suspend(() => {
                    const headers = res.getHeaders()
                    return Effect.logErrorCauseMessage(
                      "Finished request",
                      cause
                    ).apply(Effect.logAnnotates({
                      method: req.method,
                      path: req.originalUrl,
                      statusCode: res.statusCode.toString(),

                      reqPath: pars.path.$$.pretty,
                      reqQuery: pars.query.$$.pretty,
                      reqBody: pretty(pars.body),
                      reqCookies: pretty(pars.cookies),
                      reqHeaders: pars.headers.$$.pretty,

                      resHeaders: Object.entries(headers).reduce((prev, [key, value]) => {
                        prev[key] = value && typeof value === "string" ? snipString(value) : value
                        return prev
                      }, {} as Record<string, any>)
                        .$$.pretty
                    }))
                  })
                )
                  .tapErrorCause(cause => Effect(console.error("Error occurred while reporting error", cause)))
                  .setupRequestFrom
              )
              .tap(() =>
                RequestSettings.get.flatMap(s => {
                  const headers = res.getHeaders()
                  return Effect.logInfo("Finished request").apply(Effect.logAnnotates({
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode.toString(),
                    ...s.verbose
                      ? {
                        resHeaders: headers.$$.pretty
                      }
                      : undefined
                  }))
                }).setupRequestFrom
              )
              .setupRequestFrom
          )
            .provideService(RequestContextContainer, new RequestContextContainerImpl(requestContext)) // otherwise external error reporter breaks.
        )
    )
  }
}
