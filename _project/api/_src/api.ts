import * as Ex from "@effect-app/infra-adapters/express"
import { writeOpenapiDocs } from "@effect-app/infra/api/writeDocs"
import type { ApiMainConfig } from "./config.js"
import * as MW from "./middleware/index.js"
import * as R from "./routes.js"
import { Operations, StoreMaker, UserRepo } from "./services.js"
import { Events } from "./services/Events.js"

const routes = Effect.struct(R)

export function api(cfg: ApiMainConfig) {
  const logServerStart = Effect(`Running on ${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`)
    .flatMap(Effect.logInfo)

  const middleware = MW.events
    > Ex.use(MW.compression())
    > Ex.use(
      MW.urlEncoded({ extended: false }),
      MW.json({ limit: "10mb" /* TODO */ })
    )
    > MW.serverHealth(cfg.apiVersion)
    > MW.openapiRoutes

  const app = middleware > routes

  const program = app
    .flatMap(writeOpenapiDocs)
    > logServerStart

  const services = Events.Live
    > StoreMaker.Live(Config(cfg.storage))
    > UserRepo.Live(
      cfg.fakeUsers === "sample" ? "sample" : ""
    )
    > Operations.Live
    > Ex.LiveExpress(cfg.host, cfg.port)

  return services
    > program
      .toScopedDiscardLayer
}
