/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Effect, flow, Predicate } from "@effect-app/core"
import { RpcResolver } from "@effect/rpc"
import { HttpRpcResolver } from "@effect/rpc-http"
import type { RpcRouter } from "@effect/rpc/RpcRouter"
import type * as Serializable from "@effect/schema/Serializable"
import type { ApiConfig, FetchResponse } from "effect-app/client"
import { makePathWithBody, makePathWithQuery } from "effect-app/client"
import type { HttpClient } from "effect-app/http"
import type { REST, Schema } from "effect-app/schema"
import { typedKeysOf } from "effect-app/utils"
import type * as Request from "effect/Request"
import { apiClient, S } from "../lib.js"

type Requests = Record<string, any>
type AnyRequest =
  & Omit<
    REST.QueryRequest<any, any, any, any, any, any>,
    "method"
  >
  & REST.RequestSchemed<any, any>

const cache = new Map<any, Client<any>>()

export type Client<M extends Requests> =
  & RequestHandlers<
    ApiConfig | HttpClient.HttpClient.Service,
    never, // SupportedErrors | FetchError | ResError,
    M
  >
  & RequestHandlersE<
    ApiConfig | HttpClient.HttpClient.Service,
    never, // SupportedErrors | FetchError | ResError,
    M
  >

export function clientFor<M extends Requests>(
  models: M
): Client<Omit<M, "meta">> {
  const found = cache.get(models)
  if (found) {
    return found
  }
  const m = clientFor_(models)
  cache.set(models, m)
  return m
}

function clientFor_<M extends Requests>(models: M) {
  type Filtered = {
    [K in keyof Requests as Requests[K] extends S.Schema.All & { success: S.Schema.All } ? K : never]:
      Requests[K] extends S.Schema.All & { success: S.Schema.All } ? Requests[K] : never
  }
  const filtered = typedKeysOf(models).reduce((acc, cur) => {
    if (
      Predicate.isObject(models[cur])
      && (models[cur].success)
    ) {
      acc[cur as keyof Filtered] = models[cur]
    }
    return acc
  }, {} as Filtered)
  return (typedKeysOf(filtered)
    // ignore module interop with automatic default exports..
    .filter((x) => x !== "default" && x !== "meta")
    .reduce((prev, cur) => {
      const h = filtered[cur]

      const Request = h
      const Response = h.success

      const m = (models as any).meta as { moduleName: string }
      if (!m) throw new Error("No meta defined in Resource!")
      const requestName = `${m.moduleName}.${cur as string}`
        .replaceAll(".js", "")

      const meta = {
        Request,
        Response,
        mapPath: Request._tag,
        name: requestName
      }

      const resolver = flow(
        HttpRpcResolver.make<RpcRouter<any, any>>,
        (_) => RpcResolver.toClient(_ as any)
      )
      const client = apiClient.pipe(Effect.andThen(resolver))

      // const res = Response as Schema<any>
      // const parseResponse = flow(S.decodeUnknown(res), (_) => Effect.mapError(_, (err) => new ResError(err)))
      // const parseResponseE = flow(
      //   S.decodeUnknown(S.encodedSchema(res)),
      //   (_) => Effect.mapError(_, (err) => new ResError(err))
      // )

      // const path = new Path(Request.path)
      // const parse = mapResponseM(parseResponse)
      // const parseE = mapResponseM(parseResponseE)

      // TODO: look into ast, look for propertySignatures, etc.
      // TODO: and fix type wise
      // if we don't need fields, then also dont require an argument.
      const fields = Request.fields
      const path = Request._tag // TODO
      // @ts-expect-error doc
      prev[cur] = Request.method === "GET"
        ? fields.length === 0
          ? {
            handler: client
              .pipe(
                Effect.andThen((cl) => cl(new Request())),
                Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO
                Effect
                  .withSpan("client.request " + requestName, {
                    captureStackTrace: false,
                    attributes: { "request.name": requestName }
                  })
              ),
            ...meta
          }
          : {
            handler: (req: any) =>
              client
                .pipe(
                  Effect.andThen((cl) => cl(new Request(req))),
                  Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO
                  Effect
                    .withSpan("client.request " + requestName, {
                      captureStackTrace: false,
                      attributes: { "request.name": requestName }
                    })
                ),
            ...meta,
            mapPath: (req: any) => req ? makePathWithQuery(path, S.encodeSync(Request)(req)) : Request.path
          }
        : fields.length === 0
        ? {
          handler: client
            .pipe(
              Effect.andThen((cl) => cl(new Request())),
              Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO
              Effect.withSpan("client.request " + requestName, {
                captureStackTrace: false,
                attributes: { "request.name": requestName }
              })
            ),
          ...meta
        }
        : {
          handler: (req: any) =>
            client
              .pipe(
                Effect.andThen((cl) => cl(new Request(req))),
                Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO
                Effect.withSpan("client.request " + requestName, {
                  captureStackTrace: false,
                  attributes: { "request.name": requestName }
                })
              ),

          ...meta,
          mapPath: (req: any) =>
            req
              ? Request.method === "DELETE"
                ? makePathWithQuery(path, S.encodeSync(Request)(req))
                : makePathWithBody(path, S.encodeSync(Request)(req))
              : Request.path
        }

      // generate handler

      // @ts-expect-error doc
      prev[`${cur}E`] = Request.method === "GET"
        ? fields.length === 0
          ? {
            handler: client
              .pipe(
                Effect.andThen((cl) => cl(new Request())),
                Effect.flatMap((res) => S.encode(Response)(res)), // TODO
                Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO,
                Effect
                  .withSpan("client.request " + requestName, {
                    captureStackTrace: false,
                    attributes: { "request.name": requestName }
                  })
              ),
            ...meta
          }
          : {
            handler: (req: any) =>
              client
                .pipe(
                  Effect.andThen((cl) => cl(new Request(req))),
                  Effect.flatMap((res) => S.encode(Response)(res)), // TODO
                  Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO,
                  Effect
                    .withSpan("client.request " + requestName, {
                      captureStackTrace: false,
                      attributes: { "request.name": requestName }
                    })
                ),

            ...meta,
            mapPath: (req: any) => req ? makePathWithQuery(path, S.encodeSync(Request)(req)) : Request.path
          }
        : fields.length === 0
        ? {
          handler: client
            .pipe(
              Effect.andThen((cl) => cl(new Request())),
              Effect.flatMap((res) => S.encode(Response)(res)), // TODO
              Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO,
              Effect.withSpan("client.request " + requestName, {
                captureStackTrace: false,
                attributes: { "request.name": requestName }
              })
            ),
          ...meta
        }
        : {
          handler: (req: any) =>
            client
              .pipe(
                Effect.andThen((cl) => cl(new Request(req))),
                Effect.flatMap((res) => S.encode(Response)(res)), // TODO
                Effect.map((_) => ({ body: _, status: 200, headers: {} })), // TODO,
                Effect.withSpan("client.request " + requestName, {
                  captureStackTrace: false,
                  attributes: { "request.name": requestName }
                })
              ),

          ...meta,
          mapPath: (req: any) =>
            req
              ? Request.method === "DELETE"
                ? makePathWithQuery(path, S.encodeSync(Request)(req))
                : makePathWithBody(path, S.encodeSync(Request)(req))
              : Request.path
        }
      // generate handler

      return prev
    }, {} as Client<M>))
}

export type ExtractResponse<T> = T extends Schema<any, any, any> ? Schema.Type<T>
  : T extends unknown ? void
  : never

export type ExtractEResponse<T> = T extends Schema<any, any, any> ? Schema.Encoded<T>
  : T extends unknown ? void
  : never

type IsEmpty<T> = keyof T extends never ? true
  : false

type Cruft = "_tag" | Request.RequestTypeId | typeof Serializable.symbol | typeof Serializable.symbolResult

// TODO: refactor to new Request pattern, then filter out non-requests similar to the runtime changes in clientFor, and matchFor (boilerplate)
type RequestHandlers<R, E, M extends Requests> = {
  [K in keyof M]: IsEmpty<Omit<S.Schema.Type<M[K]>, Cruft>> extends true ? {
      handler: Effect<FetchResponse<Schema.Type<M[K]["success"]>>, Schema.Type<M[K]["failure"]> | E, R>
      Request: M[K]
      Reponse: Schema.Type<M[K]["success"]>
      mapPath: string
      name: string
    }
    : {
      handler: (
        req: Omit<S.Schema.Type<M[K]>, Cruft>
      ) => Effect<
        FetchResponse<Schema.Type<M[K]["success"]>>,
        Schema.Type<M[K]["failure"]> | E,
        R
      >
      Request: M[K]
      Reponse: Schema.Type<M[K]["success"]>
      mapPath: (req: Omit<S.Schema.Type<M[K]>, Cruft>) => string
      name: string
    }
}

type RequestHandlersE<R, E, M extends Requests> = {
  [K in keyof M & string as `${K}E`]: IsEmpty<Omit<S.Schema.Type<M[K]>, Cruft>> extends true ? {
      handler: Effect<
        FetchResponse<Schema.Encoded<M[K]["success"]>>,
        Schema.Type<M[K]["failure"]> | E,
        R
      >
      Request: M[K]
      Reponse: Schema.Type<M[K]["success"]>
      mapPath: string
      name: string
    }
    : {
      handler: (
        req: Omit<
          S.Schema.Type<M[K]>,
          Cruft
        >
      ) => Effect<
        FetchResponse<Schema.Encoded<M[K]["success"]>>,
        Schema.Type<M[K]["failure"]> | E,
        R
      >
      Request: M[K]
      Reponse: Schema.Type<M[K]["success"]>
      mapPath: (req: Omit<S.Schema.Type<M[K]>, Cruft>) => string
      name: string
    }
}
