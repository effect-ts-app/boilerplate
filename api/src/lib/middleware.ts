import { Effect } from "effect-app"
import { HttpHeaders, HttpMiddleware, HttpServerRequest, HttpServerResponse } from "effect-app/http"
// codegen:end

import z from "zlib"

export * from "@effect-app/infra/api/middlewares"

// codegen:start {preset: barrel, include: ./middleware/*.ts}
export * from "./middleware/events.js"
// codegen:end

export const gzip = HttpMiddleware.make(
  (app) =>
    Effect.gen(function*() {
      const r = yield* app
      const body = r.body
      if (
        body._tag !== "Uint8Array"
        || body.contentLength === 0
      ) return r

      const req = yield* HttpServerRequest.HttpServerRequest
      if (
        !req
          .headers["accept-encoding"]
          ?.split(",")
          .map((_) => _.trim())
          .includes("gzip")
      ) return r

      // TODO: a stream may be better, for realtime compress?
      const buffer = yield* Effect.async<Buffer>((cb) =>
        z.gzip(body.body, (err, r) => cb(err ? Effect.die(err) : Effect.succeed(r)))
      )

      return HttpServerResponse.uint8Array(
        buffer,
        {
          cookies: r.cookies,
          status: r.status,
          statusText: r.statusText,
          contentType: body.contentType,
          headers: HttpHeaders.fromInput({ ...r.headers, "Content-Encoding": "gzip" })
        }
      )
    })
)
