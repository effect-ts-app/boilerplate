import { reportError } from "@effect-app/infra/errorReporter"
import { logJson } from "@effect-app/infra/logger/jsonLogger"
import { logFmt } from "@effect-app/infra/logger/logFmtLogger"
import { runMain as runMainPlatform } from "@effect/platform-node/NodeRuntime"
import { constantCase } from "change-case"
import { Cause, Exit, Layer } from "effect"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Effect from "effect/Effect"
import * as Logger from "effect/Logger"
import * as Level from "effect/LogLevel"
import * as Scope from "effect/Scope"
import { installFluentRuntimeExtensions } from "@effect-app/fluent-extensions/runtime"
import type * as Runtime from "effect/Runtime"
import type * as Fiber from "effect/Fiber"

const makeBasicRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(Layer.buildWithScope(layer, scope))
    const runtime = yield* $(
      Effect.runtime<A>().pipe(Effect.scoped, Effect.provide(env))
    )

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit)
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

installFluentRuntimeExtensions(basicRuntime.runtime)

const reportMainError = <E>(cause: Cause.Cause<E>) =>
  Cause.isInterruptedOnly(cause) ? Effect.unit : reportError("Main")(cause)

export function runMain<E, A>(eff: Effect.Effect<A, E, never>) {
  return runMainPlatform(
    eff
      .pipe(
        Effect.tapErrorCause(reportMainError),
        Effect.provide(basicLayer)
      )
  )
}

export type RT = typeof basicRuntime.runtime extends Runtime.Runtime<infer R> ? R : never

declare module "effect/Effect" {
  export interface Effect<A, E, R> {
    // @ts-expect-error meh
    get runPromise(this: Effect<RT, E, A>): Promise<A>
    // @ts-expect-error meh
    get runSync(this: Effect<RT, E, A>): A
    runFork<E, A>(
      this: Effect<RT, E, A>,
      options?: Runtime.RunForkOptions,
    ): Fiber.RuntimeFiber<E, A>
  }
}

declare module "effect/Cause" {
  export interface YieldableError {
    // @ts-expect-error meh
    get runPromise(this: Effect.Effect<RT, typeof this, never>): Promise<never>
    // @ts-expect-error meh
    get runSync(this: Effect.Effect<RT, typeof this, never>): never
    runFork<E, A>(
      this: Effect.Effect<RT, E, A>,
      options?: Runtime.RunForkOptions,
    ): Fiber.RuntimeFiber<E, A>
  }
}