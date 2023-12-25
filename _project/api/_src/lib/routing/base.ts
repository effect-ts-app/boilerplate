/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/ban-types */
import * as S from "@effect-app/schema"

import type { EnforceNonEmptyRecord } from "@effect-app/core/utils"
import { ValidationError } from "@effect-app/infra/errors"
import type express from "express"
import type { HttpRequestError, HttpRoute } from "../http.js"
import type { RequestHandler } from "./RequestEnv.js"

export type Flatten<T extends object> = object extends T ? object : {
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
          /*: Flatten<V> extends infer FV ? ({
      [P in keyof FV as `${Extract<K, string | number>}.${Extract<P, string | number>}`]: FV[P]
    })
    : never
    */
        : Pick<T, K>
      : never
      : never
  ) => void
} extends Record<keyof T, (y: infer O) => void> ? O extends unknown /* infer U */ ? { [K in keyof O]: O[K] } : never
: never

export type RouteMatch<
  R,
  M,
  PR = never
> // RErr = never,
 = // PathA,
  // CookieA,
  // QueryA,
  // BodyA,
  // HeaderA,
  // ReqA extends PathA & QueryA & BodyA,
  // ResA,
  // PR = never
  Effect<
    never,
    never,
    HttpRoute<Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>, HttpRequestError> // RouteDescriptor<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, SupportedErrors, Methods>
  >

export function handle<
  TModule extends Record<
    string,
    any // { Model: S.Schema<any, any>; new (...args: any[]): any } | S.Schema<any, any>
  >
>(
  _: TModule & { ResponseOpenApi?: any },
  adaptResponse?: any
) {
  // TODO: Prevent over providing // no strict/shrink yet.
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

export interface ReqHandler<
  Req,
  R,
  E,
  Res,
  ReqSchema extends S.Schema<any, any>,
  ResSchema extends S.Schema<any, any>,
  CTX = any
> {
  h: (r: Req, ctx: CTX) => Effect<R, E, Res>
  Request: ReqSchema
  Response: ResSchema
  ResponseOpenApi: any
}

export type ReqFromSchema<ReqSchema extends S.Schema<any, any>> = S.Schema.To<ReqSchema>

export type Extr<T> = T extends { Model: S.Schema<any, any> } ? T["Model"]
  : T extends S.Schema<any, any> ? T
  : never

export type ResFromSchema<ResSchema> = S.Schema.To<Extr<ResSchema>>

export type _R<T extends Effect<any, any, any>> = [T] extends [
  Effect<infer R, any, any>
] ? R
  : never

export type _E<T extends Effect<any, any, any>> = [T] extends [
  Effect<any, infer E, any>
] ? E
  : never

export type Request2<
  Path extends string,
  Method extends S.REST.Methods.Rest,
  ReqA
> = S.REST.ReqRes<unknown, ReqA> & {
  method: Method
  path: Path
}

export type Encode<A, E> = (a: A) => E

// function getErrorMessage(current: ContextEntry) {
//   switch (current.type.name) {
//     case "NonEmptyString":
//       return "Must not be empty"
//   }
//   if (current.type.name?.startsWith("NonEmptyReadonlyArray<")) {
//     return "Must not be empty"
//   }
//   return `Invalid value specified`
// }
export function decodeErrors(x: unknown) {
  return [x]
}

// const ValidationApplicative = Effect.getValidationApplicative(
//   makeAssociative<ReadonlyArray<{ type: string; errors: ReturnType<typeof decodeErrors> }>>(
//     (l, r) => l.concat(r)
//   )
// )

// const structValidation = DSL.structF(ValidationApplicative)
export function parseRequestParams<PathA, CookieA, QueryA, BodyA, HeaderA>(
  parsers: RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA>
) {
  return (
    { body, cookies, headers, params, query }: {
      body: unknown
      cookies: unknown
      headers: unknown
      params: unknown
      query: unknown
    }
  ) =>
    Effect
      .all({
        body: parsers
          .parseBody(body)
          .exit
          .flatMap((_) =>
            _.isFailure() && !_.cause.isFailure()
              ? (Effect.failCauseSync(() => _.cause) as Effect<never, ValidationError, never>)
              : Effect(
                _.isSuccess()
                  ? { _tag: "Success" as const, value: _.value }
                  : { _tag: "Failure", errors: _.cause.failures }
              )
          ),
        cookie: parsers
          .parseCookie(cookies)
          .exit
          .flatMap((_) =>
            _.isFailure() && !_.cause.isFailure()
              ? (Effect.failCauseSync(() => _.cause) as Effect<never, ValidationError, never>)
              : Effect(
                _.isSuccess()
                  ? { _tag: "Success" as const, value: _.value }
                  : { _tag: "Failure", errors: _.cause.failures }
              )
          ),
        headers: parsers
          .parseHeaders(headers)
          .exit
          .flatMap((_) =>
            _.isFailure() && !_.cause.isFailure()
              ? (Effect.failCauseSync(() => _.cause) as Effect<never, ValidationError, never>)
              : Effect(
                _.isSuccess()
                  ? { _tag: "Success" as const, value: _.value }
                  : { _tag: "Failure", errors: _.cause.failures }
              )
          ),
        query: parsers
          .parseQuery(query)
          .exit
          .flatMap((_) =>
            _.isFailure() && !_.cause.isFailure()
              ? (Effect.failCauseSync(() => _.cause) as Effect<never, ValidationError, never>)
              : Effect(
                _.isSuccess()
                  ? { _tag: "Success" as const, value: _.value }
                  : { _tag: "Failure", errors: _.cause.failures }
              )
          ),
        path: parsers
          .parsePath(params)
          .exit
          .flatMap((_) =>
            _.isFailure() && !_.cause.isFailure()
              ? (Effect.failCauseSync(() => _.cause) as Effect<never, ValidationError, never>)
              : Effect(
                _.isSuccess()
                  ? { _tag: "Success" as const, value: _.value }
                  : { _tag: "Failure", errors: _.cause.failures }
              )
          )
      })
      .flatMap(({ body, cookie, headers, path, query }) => {
        const errors: unknown[] = []
        if (body._tag === "Failure") {
          errors.push(makeError("body")(body.errors))
        }
        if (cookie._tag === "Failure") {
          errors.push(makeError("cookie")(cookie.errors))
        }
        if (headers._tag === "Failure") {
          errors.push(makeError("headers")(headers.errors))
        }
        if (path._tag === "Failure") {
          errors.push(makeError("path")(path.errors))
        }
        if (query._tag === "Failure") {
          errors.push(makeError("query")(query.errors))
        }
        if (errors.length) {
          return new ValidationError({ errors })
        }
        return Effect({
          body: body.value!,
          cookie: cookie.value!,
          headers: headers.value!,
          path: path.value!,
          query: query.value!
        })
      })
}

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function mapErrors_<E, NE, NER extends Record<string, Effect<any, E, any>>>(
//   t: NER, // TODO: enforce non empty
//   mapErrors: (k: keyof NER) => (err: E) => NE
// ): {
//   [K in keyof NER]: Effect<_R<NER[K]>, NE, Effect.Success<NER[K]>>
// } {
//   return typedKeysOf(t).reduce(
//     (prev, cur) => {
//       prev[cur] = t[cur].mapError(mapErrors(cur))
//       return prev
//     },
//     {} as {
//       [K in keyof NER]: Effect<_R<NER[K]>, NE, Effect.Success<NER[K]>>
//     }
//   )
// }

function makeError(type: string) {
  return (e: unknown) => [{ type, errors: decodeErrors(e) }]
}

export function respondSuccess<ReqA, A, E>(
  encodeResponse: (req: ReqA) => Encode<A, E>
) {
  return (req: ReqA, res: express.Response) =>
    flow(encodeResponse(req), Effect.succeed, (_) =>
      _.flatMap((r) =>
        Effect.sync(() => {
          r === undefined
            ? res.status(204).send()
            : res.status(200).send(JSON.stringify(r))
        })
      ))
}

export interface RequestHandler2<
  R,
  Path extends string,
  Method extends S.REST.Methods.Rest,
  ReqA,
  ResA,
  ResE
> {
  h: (i: ReqA) => Effect<R, ResE, ResA>
  Request: Request2<Path, Method, ReqA>
  Response: S.REST.ReqRes<unknown, ResA>
}

export function makeRequestParsers<
  R,
  M,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  Errors,
  PPath extends `/${string}`
>(
  Request: RequestHandler<
    R,
    M,
    PathA,
    CookieA,
    QueryA,
    BodyA,
    HeaderA,
    ReqA,
    ResA,
    Errors,
    PPath
  >["Request"]
): RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA> {
  const ph = Effect(
    Option
      .fromNullable(Request.Headers)
      .map((s) => s)
      .map(S.parse)
  )
  const parseHeaders = (u: unknown) => ph.flatMapOpt((d) => d(u))

  const pq = Effect(
    Option
      .fromNullable(Request.Query)
      .map((s) => s)
      .map(S.parse)
  )
  const parseQuery = (u: unknown) => pq.flatMapOpt((d) => d(u))

  const pb = Effect(
    Option
      .fromNullable(Request.Body)
      .map((s) => s)
      .map(S.parse)
  )
  const parseBody = (u: unknown) => pb.flatMapOpt((d) => d(u))

  const pp = Effect(
    Option
      .fromNullable(Request.Path)
      .map((s) => s)
      .map(S.parse)
  )
  const parsePath = (u: unknown) => pp.flatMapOpt((d) => d(u))

  const pc = Effect(
    Option
      .fromNullable(Request.Cookie)
      .map((s) => s)
      .map(S.parse)
  )
  const parseCookie = (u: unknown) => pc.flatMapOpt((d) => d(u))

  return {
    parseBody,
    parseCookie,
    parseHeaders,
    parsePath,
    parseQuery
  }
}

type Decode<A> = (u: unknown) => Effect<never, unknown, A>

export interface RequestParsers<PathA, CookieA, QueryA, BodyA, HeaderA> {
  parseHeaders: Decode<Option<HeaderA>>
  parseQuery: Decode<Option<QueryA>>
  parseBody: Decode<Option<BodyA>>
  parsePath: Decode<Option<PathA>>
  parseCookie: Decode<Option<CookieA>>
}
