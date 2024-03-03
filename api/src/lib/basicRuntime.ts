import { reportError } from "@effect-app/infra/errorReporter"
import { logJson } from "@effect-app/infra/logger/jsonLogger"
import { logFmt } from "@effect-app/infra/logger/logFmtLogger"
import { runMain as runMainPlatform } from "@effect/platform-node/NodeRuntime"
import { constantCase } from "change-case"
import { Cause, Effect, Exit, Layer, Scope } from "effect-app"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Logger from "effect/Logger"
import * as Level from "effect/LogLevel"
import * as Runtime from "effect/Runtime"

const makeBasicRuntime = <R, A, E>(layer: Layer<R, A, E>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(Layer.buildWithScope(layer, scope))
    const runtime = yield* $(
      Effect.runtime<A>().pipe(Effect.scoped, Effect.provide(env))
    )

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit),
      runSync: Runtime.runSync(runtime),
      runPromise: Runtime.runPromise(runtime),
      runFork: Runtime.runFork(runtime)
    }
  })

const envProviderConstantCase = ConfigProvider.mapInputPath(
  ConfigProvider.fromEnv({
    pathDelim: "_", // i'd prefer "__"
    seqDelim: ","
  }),
  constantCase
)

const levels = {
  [Level.Trace.label]: Level.Trace,
  [Level.Debug.label]: Level.Debug,
  [Level.Info.label]: Level.Info,
  [Level.Warning.label]: Level.Warning,
  [Level.Error.label]: Level.Error
}

const configuredLogLevel = process.env["LOG_LEVEL"]
const configuredEnv = process.env["ENV"]

const logLevel = configuredLogLevel
  ? levels[configuredLogLevel]
  : configuredEnv && configuredEnv === "prod"
  ? Level.Info
  : Level.Debug
if (!logLevel) throw new Error(`Invalid LOG_LEVEL: ${configuredLogLevel}`)

export const basicLayer = Layer.mergeAll(
  Logger.minimumLogLevel(logLevel),
  configuredEnv && configuredEnv !== "local-dev" ? logJson : logFmt,
  Layer.setConfigProvider(envProviderConstantCase)
)

export const basicRuntime = Effect.runSync(makeBasicRuntime(basicLayer))

const reportMainError = <E>(cause: Cause.Cause<E>) =>
  Cause.isInterruptedOnly(cause) ? Effect.unit : reportError("Main")(cause)

export function runMain<A, E>(eff: Effect<A, E, never>) {
  return runMainPlatform(
    eff
      .pipe(
        Effect.tapErrorCause(reportMainError),
        Effect.provide(basicLayer)
      )
  )
}

export type RT = typeof basicRuntime.runtime extends Runtime.Runtime<infer R> ? R : never
