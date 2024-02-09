import * as Ex from "@effect-app/infra-adapters/express"
// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import type { RouteDescriptorAny } from "@effect-app/infra/api/express/schema/routing"
import { RouteDescriptors } from "@effect-app/infra/api/routing"
import { Live as OperationsLive } from "@effect-app/infra/services/Operations/live"
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
import { RequestContextMiddleware } from "./middleware/index.js"
import { UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

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
      .pipe(Effect.map((_) =>
        HttpRouter
          .fromIterable([
            _["usecasesHelloWorldControllers.Get"],
            _["usecasesMeControllers.Get"]
            // _["usecasesOperationsControllers.Find"]// TODO: how to mount unify these?
          ])
          .pipe(HttpRouter.get("/events", MW.events))
          .pipe(HttpRouter.use(RequestContextMiddleware))
      ))
      // .zipLeft(RouteDescriptors.andThen((_) => _.get).andThen(writeOpenapiDocsI))
      .pipe(Effect.provideService(RouteDescriptors, Ref.unsafeMake<RouteDescriptorAny[]>([])))

    const serve = app
      .andThen(MW.serverHealth(cfg.apiVersion))
      .andThen(MW.cors())
      // we trust proxy and handle the x-forwarded etc headers
      .andThen(HttpMiddleware.xForwardedHeaders)
      .pipe(
        Effect.zipLeft(
          Effect.logInfo(`Running on http://${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
        )
      )
      .pipe(HttpServer.serve(HttpMiddleware.logger))

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
      UserRepo.Live
    )
)
