import { writeOpenapiDocs } from "@effect-ts-app/boilerplate-infra/lib/api/writeDocs"
import * as Ex from "@effect-ts-app/infra/express/index"
import type { ApiMainConfig } from "./config.js"
import * as MW from "./middleware/index.js"
import * as R from "./routes.js"
import { Operations, StoreMaker, UserRepository } from "./services.js"
import { Events } from "./services/Events.js"

const routes = Effect.struct(R)

export const App = Tag<never>()

export function api(cfg: ApiMainConfig) {
  const logServerStart = Effect(() =>
    `Running on ${cfg.host}:${cfg.port} at version: ${cfg.apiVersion}. ENV: ${cfg.env}`
  )
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
    > UserRepository.Live(
      cfg.fakeUsers === "sample" ? "sample" : ""
    )
    > Operations.Live
    > Ex.LiveExpress(cfg.host, cfg.port)

  return services
    > program
      .map(_ => _ as never)
      .toScopedLayer(App)
}
