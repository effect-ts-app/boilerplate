/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@effect-app-boilerplate/api-api/api"
import { reportError } from "@effect-app/infra/errorReporter"
import { CauseException } from "@effect-app/infra/errors"
import { ApiConfig, BaseConfig } from "./config.js"
import { Emailer, MemQueue } from "./services.js"

import { runtimeDebug } from "@effect/io/Debug"

if (process.argv.includes("--debug")) {
  runtimeDebug.minumumLogLevel = "Debug"
  runtimeDebug.traceExecutionLogEnabled = true
}

const SUPPORTED_MODES = ["PRINT", "ALL", "API"] as const

const appConfig = BaseConfig.config.unsafeRunSync$

// Sentry.init({
//   dsn: appConfig.sentry.dsn.value,
//   environment: appConfig.env,
//   enabled: appConfig.env !== "local-dev",
//   release: appConfig.apiVersion,
//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0
// })

const main = Effect.gen(function*($) {
  const PROVIDED_MODE = process.argv[2] ?? "ALL"
  if (!PROVIDED_MODE || !SUPPORTED_MODES.includes(PROVIDED_MODE as any)) {
    throw new Error(`Supported modes: ${SUPPORTED_MODES.join(", ")}`)
  }
  const mode: typeof SUPPORTED_MODES[number] = PROVIDED_MODE as any
  console.debug("Starting in MODE: " + mode)

  switch (mode) {
    case "ALL": {
      const apiConfig = yield* $(ApiConfig.config)
      const cfg = { ...appConfig, ...apiConfig }
      console.debug(`Config: ${JSON.stringify(cfg, undefined, 2)}`)

      return yield* $(Effect.never().scoped.provideLayer(api(cfg)))
    }

    case "API": {
      const apiConfig = yield* $(ApiConfig.config)
      const cfg = { ...appConfig, ...apiConfig }
      console.debug(`Config: ${JSON.stringify(cfg, undefined, 2)}`)

      return yield* $(Effect.never().scoped.provideLayer(api(cfg)))
    }
  }
})

const program = main
  .provideSomeLayer(
    (appConfig.sendgrid.apiKey
      ? Emailer.LiveSendgrid(Config(appConfig.sendgrid))
      : Emailer.Fake)
      > MemQueue.Live
  )

export class AppException<E> extends CauseException<E> {
  constructor(cause: Cause<E>) {
    super(cause, "App")
  }
}
export const reportAppError = reportError(cause => new AppException(cause))

program
  .tapErrorCause(reportAppError)
  .runMain$()
