import { FakeSendgrid } from "@effect-app/infra/services/Emailer/fake"
import { Sendgrid } from "@effect-app/infra/services/Emailer/Sendgrid"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { StoreMakerLayer } from "@effect-app/infra/services/Store/index"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import { Effect, Layer, Secret } from "effect-app"
import { SendgridConfig, StorageConfig } from "./config.js"

export const RepoLive = StorageConfig
  .pipe(Effect.andThen(StoreMakerLayer), Layer.unwrapEffect, Layer.merge(ContextMapContainer.live))

  export const RepoTest = StoreMakerLayer({ url: Secret.fromString("mem://"), prefix: "test_", dbName: "test" })
  .pipe(
    Layer.merge(ContextMapContainer.live)
  )
  
export const EmailerLive = SendgridConfig
  .pipe(
    Effect.andThen((cfg) =>
      cfg.apiKey
        ? Sendgrid(cfg)
        : FakeSendgrid
    ),
    Layer.unwrapEffect
  )

export const Platform = HttpClientNode.layer
