import { FakeSendgrid } from "@effect-app/infra/services/Emailer/fake"
import { Sendgrid } from "@effect-app/infra/services/Emailer/Sendgrid"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import { StoreMakerLayer } from "@effect-app/infra/services/Store/index"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import { Layer } from "effect-app"
import { SendgridConfig, StorageConfig } from "./config"

export const RepoLive = StorageConfig
  .andThen(StoreMakerLayer)
  .pipe(Layer.unwrapEffect, Layer.merge(ContextMapContainer.live))

export const EmailerLive = SendgridConfig
  .andThen((cfg) =>
    cfg.apiKey
      ? Sendgrid(cfg)
      : FakeSendgrid
  )
  .pipe(Layer.unwrapEffect)

export const Platform = HttpClientNode.layer
