import * as Ex from "@effect-app/infra-adapters/express"
import { type RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"
// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import { HttpMiddleware, HttpRouter } from "@effect-app/infra/api/http"
import { RouteDescriptors } from "@effect-app/infra/api/routing"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import * as HttpNode from "@effect/platform-node/Http/Server"
import * as HttpClientNode from "@effect/platform-node/HttpClient"
import * as NodeContext from "@effect/platform-node/NodeContext"
import * as HttpServer from "@effect/platform/Http/Server"
import { all } from "api/routes.js"
import { createServer } from "node:http"
import { MergedConfig } from "./config.js"
import * as MW from "./middleware/index.js"
import { RequestContextMiddleware } from "./middleware/RequestContextMiddleware.js"
import { BlogPostRepo, Operations, UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

export const devApi = MergedConfig
  .andThen((cfg) => {
    const app = MW.openapiRoutes("http://localhost:" + cfg.port)
    const program = app
      .andThen(Effect.logInfo(`Running /docs and /swagger on http://${cfg.host}:${cfg.devPort}`))
    const services = Ex.LiveExpress(cfg.host, cfg.devPort)
    return program.toLayerScopedDiscard.provide(services)
  })
  .unwrapLayer

export const ApiPortTag = Tag<{ port: number }>()

const App = Effect
  .all([MergedConfig, Effect.serviceOption(ApiPortTag)])
  .andThen(([cfg, portOverride]) => {
    if (portOverride.isSome()) cfg = { ...cfg, port: portOverride.value.port }

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
      .map((_) =>
        HttpRouter
          .fromIterable(Object.values(_))
          .pipe(HttpRouter.get("/events", MW.events))
          .pipe(HttpRouter.use(RequestContextMiddleware))
      )
      // .zipLeft(RouteDescriptors.flatMap((_) => _.get).flatMap(writeOpenapiDocsI))
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
      .unwrapLayer

    const HttpLive = serve
      .provide(ServerLive)
      .provide(NodeContext.layer)

    const services = Operations
      .Live
      .merge(Events.Live)

    return HttpLive.provide(services)
  })
  .unwrapLayer

export const api = App.provide(
  Layer
    .mergeAll(
      ContextMapContainer.live,
      RequestContextContainer.live,
      HttpClientNode.client.layer,
      UserRepo.Live,
      BlogPostRepo.Live
    )
)
