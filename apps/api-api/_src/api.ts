import { writeOpenapiDocs } from "@effect-ts-app/boilerplate-infra/lib/api/writeDocs.js"
import * as MW from "./middleware/index.js"
import * as R from "./routes.js"

import type * as _cfg from "@/config.js"
import { StoreMakerLive } from "@effect-ts-app/boilerplate-infra/services/Store/index"
import * as Ex from "@effect-ts-app/infra/express/index"
import { UserRepository } from "./services.js"
import { Events } from "./services/Events.js"

const routes = Effect.struct(R)

export function api(cfg: typeof _cfg & ReturnType<typeof _cfg.API>) {
  const logServerStart = Effect.sync(() =>
    `Running on ${cfg.HOST}:${cfg.PORT} at version: ${cfg.API_VERSION}. ENV: ${cfg.ENV}`
  )
    .flatMap(msg => Effect.sync(() => console.log(msg)) > logger.info(msg))

  const middleware = MW.events
    > Ex.use(MW.urlEncoded({ extended: false }), MW.json())
    > MW.serverHealth(cfg.API_VERSION)
    > MW.openapiRoutes

  const app = middleware > routes

  return app // API
    .flatMap(writeOpenapiDocs)
    .zipRight(logServerStart > Effect.never)
    .provideSomeLayer(Ex.LiveExpress(cfg.HOST, cfg.PORT))
    .provideSomeLayer(
      StoreMakerLive(cfg.STORAGE_URL, {
        env: cfg.ENV,
        serviceName: cfg.serviceName,
        STORAGE_PREFIX: cfg.STORAGE_PREFIX
      }) >
        UserRepository.Live()
    )
    .provideSomeLayer(Events.Live)
}
