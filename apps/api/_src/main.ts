/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@effect-ts-app/api-api/api"

// import * as Sentry from "@sentry/node"
import * as _cfg from "./config.js"
import { Emailer, MemQueue } from "./services.js"

import type {} from "@effect-ts-app/boilerplate-infra/services/Emailer/fake"
import type {} from "@effect-ts-app/boilerplate-infra/services/Emailer/Sendgrid"

const { QUEUE_URL, SENDGRID_API_KEY } = _cfg
const SUPPORTED_MODES = ["ALL", "API"] as const

// Sentry.init({
//   dsn: SENTRY_DSN,
//   environment: ENV,
//   enabled: ENV !== "local-dev",
//   release: _cfg.API_VERSION,
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
      const cfg = { ..._cfg, ..._cfg.API() }
      console.debug(`Config: ${JSON.stringify(cfg, undefined, 2)}`)

      return [yield* $(api(cfg).fork)]
    }

    case "API": {
      const cfg = { ..._cfg, ..._cfg.API() }
      console.debug(`Config: ${JSON.stringify(cfg, undefined, 2)}`)

      if (!QUEUE_URL.startsWith("Endpoint=")) {
        throw new Error("Cannot run with an in-process queue")
      }
      return [yield* $(api(cfg).fork)]
    }
  }
})

const processes = main
  .flatMap(_ => Fiber.joinAll(_))

const program = processes
  .provideSomeLayer(
    (SENDGRID_API_KEY ? Emailer.LiveSendgrid({ ..._cfg, SENDGRID_API_KEY }) : Emailer.Fake)
      > MemQueue.Live
      > Logger.consoleLoggerLayer
  )

program.runMain()
