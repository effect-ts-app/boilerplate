import * as Ex from "@effect-app/infra-adapters/express"
// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import type { RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"
import { RouteDescriptors } from "@effect-app/infra/api/routing"
import { Live as OperationsLive } from "@effect-app/infra/services/Operations/live"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { NodeContext } from "@effect/platform-node"
import { all } from "api/routes"
import { Effect, Layer, Ref } from "effect-app"
import { GenericTag } from "effect/Context"
import { createServer } from "node:http"
import { MergedConfig } from "./config"
import { HttpClientNode, HttpMiddleware, HttpNode, HttpRouter, HttpServer } from "./lib/http"
import * as MW from "./middleware/index"
import { RequestContextMiddleware } from "./middleware/index"
import { BlogPostRepo, UserRepo } from "./services"
import { Events } from "./services/Events"

export const devApi = MergedConfig
  .andThen((cfg) => {
    const app = MW.openapiRoutes("http://localhost:" + cfg.port)
    const program = app
      .andThen(Effect.logInfo(`Running /docs and /swagger on http://${cfg.host}:${cfg.devPort}`))
    const services = Ex.LiveExpress(cfg.host, cfg.devPort)
    const l = program.pipe(Layer.scopedDiscard, Layer.provide(services))
    return l
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
      .pipe(Effect.map((_) => {
        const routes = Object.values(_)
        return HttpRouter
          .fromIterable(routes)
          .pipe(HttpRouter.get("/events", MW.events), HttpRouter.use(RequestContextMiddleware))
      }))
      // .zipLeft(RouteDescriptors.andThen((_) => _.get).andThen(writeOpenapiDocsI))
      .pipe(Effect.provideService(RouteDescriptors, Ref.unsafeMake<RouteDescriptorAny[]>([])))

    const serve = app
      .pipe(
        Effect.map(MW.serverHealth(cfg.apiVersion)),
        Effect.map(MW.cors()),
        // we trust proxy and handle the x-forwarded etc headers
        Effect.map(HttpMiddleware.xForwardedHeaders),
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
