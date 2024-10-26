import { FakeSendgrid } from "@effect-app/infra/Emailer/fake"
import { Sendgrid } from "@effect-app/infra/Emailer/Sendgrid"
import { Operations } from "@effect-app/infra/Operations"
import { OperationsRepo } from "@effect-app/infra/OperationsRepo"
import { StoreMakerLayer } from "@effect-app/infra/Store/index"
import { NodeContext } from "@effect/platform-node"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import * as HttpNode from "@effect/platform-node/NodeHttpServer"
import { Context, Effect, Layer, Redacted } from "effect-app"
import { createServer } from "http"
import { MergedConfig, SendgridConfig, StorageConfig } from "../config.js"

export const RepoDefault = StorageConfig
  .pipe(Effect.andThen(StoreMakerLayer), Layer.unwrapEffect)

export const RepoTest = StoreMakerLayer({ url: Redacted.make("mem://"), prefix: "test_", dbName: "test" })

export const EmailerLive = SendgridConfig
  .pipe(
    Effect.andThen((cfg) =>
      cfg.apiKey
        ? Sendgrid(cfg)
        : FakeSendgrid
    ),
    Layer.unwrapEffect
  )

export const OperationsDefault = Operations.Live.pipe(
  Layer.provide(OperationsRepo.Default.pipe(Layer.provide(RepoTest)))
)

export const Platform = HttpClientNode.layer

export const ApiPortTag = Context.GenericTag<{ port: number }>("@services/ApiPortTag")

export const HttpServerLive = Effect
  .all([MergedConfig, Effect.serviceOption(ApiPortTag)])
  .pipe(
    Effect.andThen(([cfg, portOverride]) => {
      if (portOverride.value) cfg = { ...cfg, port: portOverride.value.port }

      return HttpNode.layer(() => {
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
    }),
    Layer.unwrapEffect,
    Layer.provide(NodeContext.layer)
  )
