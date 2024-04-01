import { reportError } from "@effect-app/infra/errorReporter"
import { logJson } from "@effect-app/infra/logger/jsonLogger"
import { logFmt } from "@effect-app/infra/logger/logFmtLogger"
import { constantCase } from "change-case"
import { Cause, Effect, Layer, ManagedRuntime } from "effect-app"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Logger from "effect/Logger"
import * as Level from "effect/LogLevel"
import type * as Runtime from "effect/Runtime"

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

export const basicRuntime = ManagedRuntime.make(basicLayer)

export const reportMainError = <E>(cause: Cause.Cause<E>) =>
  Cause.isInterruptedOnly(cause) ? Effect.unit : reportError("Main")(cause)

export type RT = typeof basicRuntime.runtime extends Runtime.Runtime<infer R> ? R : never
