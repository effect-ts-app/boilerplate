// import { writeOpenapiDocsI } from "@effect-app/infra/api/writeDocs"
import { RequestFiberSet } from "@effect-app/infra-adapters/RequestFiberSet"
import * as MW from "@effect-app/infra/api/middlewares"
import { RequestContextMiddleware } from "@effect-app/infra/api/middlewares"
import { Operations } from "@effect-app/infra/services/Operations"
import { OperationsRepo } from "@effect-app/infra/services/OperationsRepo"
import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import * as HttpNode from "@effect/platform-node/NodeHttpServer"
import { RpcRouter } from "@effect/rpc"
import { HttpRpcRouter } from "@effect/rpc-http"
import { Effect, flow, Layer, Option, Stream } from "effect-app"
import { HttpMiddleware, HttpRouter, HttpServer } from "effect-app/http"
import { typedValuesOf } from "effect-app/utils"
import { GenericTag } from "effect/Context"
import { createServer } from "node:http"
import { ClientEvents } from "resources.js"
import { MergedConfig } from "./config.js"
import * as controllers from "./controllers.js"
import { RepoTest } from "./lib/layers.js"
import { UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

export const ApiPortTag = GenericTag<{ port: number }>("@services/ApiPortTag")

class OperationsRepoImpl extends OperationsRepo {
  static readonly toLayer = this
    .makeWith({
      config: {
        allowNamespace: () => true
      }
    }, (_) => new this(_))
    .pipe(Layer.effect(this))
  static readonly Live = this.toLayer.pipe(Layer.provide(RepoTest))
}

const router = RpcRouter.make(...typedValuesOf(controllers))

export const api = Effect
  .gen(function*() {
    let cfg = yield* MergedConfig

    const middleware = flow(
      HttpMiddleware.logger,
      MW.cors(),
      // we trust proxy and handle the x-forwarded etc headers
      HttpMiddleware.xForwardedHeaders
    )

    const app = HttpRpcRouter.toHttpApp(router).pipe(
      HttpServer.serve(middleware)
    )

    const extra = HttpRouter.empty.pipe(
      HttpRouter.get("/events", MW.makeSSE(Stream.flatten(Events.stream), ClientEvents)),
      // HttpRouter.use(Effect.provide(RequestLayerLive)),
      HttpRouter.use(RequestContextMiddleware()),
      MW.serverHealth(cfg.apiVersion),
      HttpServer.serve(middleware)
    )

    // .tap(RouteDescriptors.andThen((_) => _.get).andThen(writeOpenapiDocsI))
    // .provideService(RouteDescriptors, Ref.unsafeMake<RouteDescriptorAny[]>([]))
    const serve = Effect
      .logInfo(`Running on http://${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
      .pipe(
        Layer.effectDiscard,
        Layer.provide(Layer.mergeAll(app, extra))
      )

    const portOverride = yield* Effect.serviceOption(ApiPortTag)
    const p = Option.getOrUndefined(portOverride)
    if (p) cfg = { ...cfg, port: p.port }

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

    const HttpLive = serve
      .pipe(
        Layer.provide(Layer.mergeAll(
          ServerLive,
          ContextMapContainer.live,
          RequestContextContainer.live,
          HttpClientNode.layer,
          UserRepo.Live,
          Operations.Live.pipe(Layer.provide(OperationsRepoImpl.Live)),
          Events.Live,
          RequestFiberSet.Live
        ))
      )
    return HttpLive
  })
  .pipe(Layer.unwrapEffect)
