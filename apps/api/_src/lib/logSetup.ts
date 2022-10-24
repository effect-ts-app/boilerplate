import * as cfg from "../config.js"
import { createLoggerConfig } from "./createLoggerConfig.js"
import { logger } from "./logger.js"

export const logServerStart = Effect.sync(() =>
  `Running on ${cfg.HOST}:${cfg.PORT} at version: ${cfg.API_VERSION}. ENV: ${cfg.ENV}`
)
  .flatMap(msg => Effect.sync(() => console.log(msg)) > logger.info(msg))

export const logLocation = Effect.sync(() => {
  if (cfg.ENV === "local-dev") {
    console.log("Logging to ./.logs")
  }
})

export const loggerConfig = createLoggerConfig({
  devMode: cfg.ENV === "local-dev",
  service: "@effect-ts-app/boilerplate-api"
})
