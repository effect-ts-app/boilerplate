import * as Ex from "@effect-ts/express"
import { app } from "./app.js"
import * as cfg from "./config.js"
import { writeOpenapiDocs } from "./lib/writeDocs.js"

const logStart = Effect.succeedWith(() =>
  `Running on ${cfg.HOST}:${cfg.PORT} at version: ${cfg.API_VERSION}. ENV: ${cfg.ENV}`
)
  .flatMap(msg => Effect.succeedWith(() => console.log(msg)))

const server = app // API
  .flatMap(writeOpenapiDocs)
  .zipRight(logStart)
  .zipRight(Effect.never)
  .inject(Ex.LiveExpress(cfg.HOST, cfg.PORT))

server.runMain()
