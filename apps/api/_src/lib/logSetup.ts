import * as cfg from "../config.js"
import { createLoggerConfig } from "./createLoggedConfig.js"
import { logger } from "./logger.js"

export const logServerStart = Effect.succeedWith(() =>
  `Running on ${cfg.HOST}:${cfg.PORT} at version: ${cfg.API_VERSION}. ENV: ${cfg.ENV}`
)
  .flatMap(msg => Effect.succeedWith(() => console.log(msg)) > logger.info(msg))

export const logLocation = Effect.succeedWith(() => {
  if (cfg.ENV === "local-dev") {
    console.log("Logging to ./.logs")
  }
})

export const loggerConfig = createLoggerConfig({
  devMode: cfg.ENV === "local-dev",
  service: "@effect-ts-app/boilerplate-api"
})
