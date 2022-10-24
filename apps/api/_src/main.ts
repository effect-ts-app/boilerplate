import { LoggerFactory, WinstonLogger } from "@effect-ts-app/infra/logger/Winston"
import * as Ex from "@effect-ts-app/infra/express"
import { app } from "./app.js"
import * as cfg from "./config.js"
import { loggerConfig, logLocation, logServerStart } from "./lib/logSetup.js"
import { writeOpenapiDocs } from "./lib/writeDocs.js"

const server = logLocation.zipRight(
  app // API
    .flatMap(writeOpenapiDocs)
    .zipRight(logServerStart)
    .zipRight(Effect.never)
    .provideLayer(
      LoggerFactory(loggerConfig) > WinstonLogger + Ex.LiveExpress(cfg.HOST, cfg.PORT)
  )
)

server.runMain()
