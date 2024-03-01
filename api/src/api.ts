// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import { Live as OperationsLive } from "@effect-app/infra/services/Operations/live"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { NodeContext } from "@effect/platform-node"
import { router } from "api/routes.js"
import { Effect, Layer } from "effect-app"
import { HttpMiddleware, HttpRouter, HttpServer } from "effect-app/http"
import { GenericTag } from "effect/Context"
import { createServer } from "node:http"
import { MergedConfig } from "./config.js"
import * as MW from "./middleware/index.js"
import { RequestContextMiddleware } from "./middleware/index.js"
import { BlogPostRepo, UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

import * as HttpNode from "@effect/platform-node/Http/Server"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"

export const ApiPortTag = GenericTag<{ port: number }>("@services/ApiPortTag")

const App = Effect
  .all([MergedConfig, Effect.serviceOption(ApiPortTag)])
  .andThen(([cfg, portOverride]) => {
    if (portOverride.value) cfg = { ...cfg, port: portOverride.value.port }

    const ServerLive = HttpNode.layer(() => {
      const s = createServer()
      s.on("request", (req) => {
        if (req.url === "/events") {
          req.socket.setTimeout(0)
          req.socket.setNoDelay(true)
          req.socket.setKeepAlive(true)
        }
      })

      return s
    }, { port: cfg.port, host: cfg.host })

    const app = router
      .pipe(
        HttpRouter.get("/events", MW.events),
        // HttpRouter.use(Effect.provide(RequestLayerLive)),
        HttpRouter.use(RequestContextMiddleware),
        MW.serverHealth(cfg.apiVersion),
        MW.cors(),
        // we trust proxy and handle the x-forwarded etc headers
        HttpMiddleware.xForwardedHeaders
      )

    // .tap(RouteDescriptors.andThen((_) => _.get).andThen(writeOpenapiDocsI))
    // .provideService(RouteDescriptors, Ref.unsafeMake<RouteDescriptorAny[]>([]))
    const serve = Effect
      .succeed(app)
      .pipe(
        Effect.zipLeft(
          Effect.logInfo(`Running on http://${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
        ),
        Effect.map(HttpServer.serve(HttpMiddleware.logger)),
        Layer.unwrapEffect
      )

    const HttpLive = serve
      .pipe(
        Layer.provide(ServerLive),
        Layer
          .provide(NodeContext.layer)
      )

    const services = Layer.merge(OperationsLive, Events.Live)

    return HttpLive.pipe(Layer.provide(services))
  })
  .pipe(Layer.unwrapEffect)

export const api = Layer.provide(
  App,
  Layer
    .mergeAll(
      ContextMapContainer.live,
      RequestContextContainer.live,
      HttpClientNode.layer,
      UserRepo.Live,
      BlogPostRepo.Live
    )
)
