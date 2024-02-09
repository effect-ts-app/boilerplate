import { Emailer } from "@effect-app/infra/services/Emailer/service"
import { StoreMaker } from "@effect-app/infra/services/Store"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
import { Layer } from "effect"
import { SendgridConfig, StorageConfig } from "./config.js"

export const RepoLive = StorageConfig
  .andThen(StoreMaker.Layer)
  .pipe(Layer.unwrapEffect)
  .merge(ContextMapContainer.live)

export const EmailerLive = SendgridConfig
  .andThen((cfg) =>
    cfg.apiKey
      ? Emailer.SendgridLayer(cfg)
      : Emailer.Fake
  )
  .pipe(Layer.unwrapEffect)

export const Platform = HttpClientNode.layer
