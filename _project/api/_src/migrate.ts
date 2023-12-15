import { Emailer } from "@effect-app/infra/services/Emailer/service"
import { StoreMaker } from "@effect-app/infra/services/Store"
import { ContextMapContainer } from "@effect-app/infra/services/Store/ContextMapContainer"
import * as HttpClientNode from "@effect/platform-node/HttpClient"
import { SendgridConfig, StorageConfig } from "./config.js"

export const RepoLive = StorageConfig
  .andThen(StoreMaker.Layer)
  .unwrapLayer
  .merge(ContextMapContainer.live)

export const EmailerLive = SendgridConfig
  .andThen((cfg) =>
    cfg.apiKey
      ? Emailer.SendgridLayer(cfg)
      : Emailer.Fake
  )
  .unwrapLayer

export const Platform = HttpClientNode.client.layer
