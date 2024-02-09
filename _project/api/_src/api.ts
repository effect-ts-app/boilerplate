import * as Ex from "@effect-app/infra-adapters/express"
import { type RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"
// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import { RouteDescriptors } from "@effect-app/infra/api/routing"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { NodeContext } from "@effect/platform-node"
import { all } from "api/routes.js"
import { Effect, Layer, Ref } from "effect"
import { GenericTag } from "effect/Context"
import { createServer } from "node:http"
import { MergedConfig } from "./config.js"
import { HttpClientNode, HttpMiddleware, HttpNode, HttpRouter, HttpServer } from "./lib/http.js"
import * as MW from "./middleware/index.js"
import { RequestContextMiddleware } from "./middleware/RequestContextMiddleware.js"
import { Operations, UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

export const devApi = MergedConfig
  .andThen((cfg) => {
    const app = MW.openapiRoutes("http://localhost:" + cfg.port)
    const program = app
      .andThen(Effect.logInfo(`Running /docs and /swagger on http://${cfg.host}:${cfg.devPort}`))
    const services = Ex.LiveExpress(cfg.host, cfg.devPort)
    return program.pipe(Layer.scopedDiscard, Layer.provide(services))
  })
  .pipe(Layer.unwrapEffect)

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

    const app = all
      .andThen((_) =>
        HttpRouter
          .fromIterable(Object.values(_))
          .pipe(HttpRouter.get("/events", MW.events))
          .pipe(HttpRouter.use(RequestContextMiddleware))
      )
      // .zipLeft(RouteDescriptors.andThen((_) => _.get).andThen(writeOpenapiDocsI))
      .provideService(RouteDescriptors, Ref.unsafeMake<RouteDescriptorAny[]>([]))

    const serve = app
      .map(MW.serverHealth(cfg.apiVersion))
      .map(MW.cors())
      // we trust proxy and handle the x-forwarded etc headers
      .map((_) => _.xForwardedHeaders)
      .zipLeft(
        Effect.logInfo(`Running on http://${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
      )
      .map(HttpServer.serve(HttpMiddleware.logger))
      .pipe(Layer.unwrapEffect)

    const HttpLive = serve
      .provide(ServerLive)
      .provide(NodeContext.layer)

    const services = Operations
      .Live
      .merge(Events.Live)

    return HttpLive.provide(services)
  })
  .pipe(Layer.unwrapEffect)

export const api = App.provide(
  Layer
    .mergeAll(
      ContextMapContainer.live,
      RequestContextContainer.live,
      HttpClientNode.layer,
      UserRepo.Live
    )
)
