/* eslint-disable @typescript-eslint/no-explicit-any */
import * as MW from "api/lib/middleware.js"
import { RequestContextMiddleware } from "api/lib/middleware.js"
import type { ConfigError } from "effect-app"
import { Console, Effect, flow, Layer } from "effect-app"
import { HttpMiddleware, HttpRouter, HttpServer } from "effect-app/http"
import { MergedConfig } from "./config/api.js"
import { Events } from "./services.js"

class RootAppRouter extends HttpRouter.Tag("RootAppRouter")<RootAppRouter>() {}
const AllRoutes = RootAppRouter
  .use((router) =>
    Effect.gen(function*() {
      yield* router.get("/events", yield* MW.makeEvents)
    })
  )
  .pipe(Layer.provide([Events.Default]))

export const makeHttpServer = <E, R, E3, R3>(
  router: { layer: Layer<never, E, R>; Router: HttpRouter.HttpRouter.TagClass<any, any, E3, R3> }
): Layer.Layer<never, E | ConfigError.ConfigError, HttpServer.HttpServer | R3 | R> =>
  Effect
    .gen(function*() {
      const cfg = yield* MergedConfig
      // using Console.log for vscode to know we're ready
      return yield* Console
        .log(`Running on http://${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
        .pipe(
          Effect.andThen(
            RootAppRouter.unwrap((root) =>
              router.Router.unwrap((app) =>
                HttpRouter.concat(root, app).pipe(
                  (router) =>
                    HttpServer.serve(
                      HttpMiddleware.logger
                    )(router.pipe(flow(
                      MW.serverHealth(cfg.apiVersion),
                      RequestContextMiddleware(),
                      MW.gzip,
                      MW.cors(),
                      // we trust proxy and handle the x-forwarded etc headers
                      HttpMiddleware.xForwardedHeaders
                    )))
                )
              )
            )
          )
        )
    })
    .pipe(
      Layer.unwrapEffect,
      Layer.provide(router.layer),
      Layer.provide(AllRoutes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any
