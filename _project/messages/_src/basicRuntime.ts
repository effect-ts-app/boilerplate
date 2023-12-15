import { reportError } from "@effect-app/infra/errorReporter"
import { logJson } from "@effect-app/infra/logger/jsonLogger"
import { logFmt } from "@effect-app/infra/logger/logFmtLogger"
import { runMain as runMainPlatform } from "@effect/platform-node/Runtime"
import { constantCase } from "change-case"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Effect from "effect/Effect"
import * as Logger from "effect/Logger"
import * as Level from "effect/LogLevel"
import * as Scope from "effect/Scope"

const makeBasicRuntime = <R, E, A>(layer: Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(layer.buildWithScope(scope))
    const runtime = yield* $(
      pipe(Effect.runtime<A>(), Effect.scoped, Effect.provide(env))
    )

    return {
      runtime,
      clean: scope.close(Exit.unit)
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

export const basicRuntime = Runtime.defaultRuntime.runSync(
  makeBasicRuntime(basicLayer)
)

/**
 * @tsplus getter effect/io/Effect runSync$
 */
export const runSync = basicRuntime.runtime.runSync

/**
 * @tsplus getter effect/io/Effect runPromise$
 */
export const runPromise = basicRuntime.runtime.runPromise

/**
 * @tsplus getter effect/io/Effect runPromiseExit$
 */
export const runPromiseExit = basicRuntime.runtime.runPromiseExit

/**
 * @tsplus fluent effect/io/Effect runCallback$
 */
export const runCallback = basicRuntime.runtime.runCallback

const reportMainError = <E>(cause: Cause<E>) =>
  Cause.isInterruptedOnly(cause) ? Effect.unit : reportError("Main")(cause)

/** @tsplus getter effect/io/Effect runMain$ */
export function runMain<E, A>(eff: Effect.Effect<never, E, A>) {
  return runMainPlatform(
    eff
      .tapErrorCause(reportMainError)
      .provide(basicLayer)
  )
}
