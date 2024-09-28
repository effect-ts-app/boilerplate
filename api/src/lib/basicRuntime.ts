import { dual } from "@effect-app/core/Function"
import { reportError } from "@effect-app/infra/errorReporter"
import { logJson } from "@effect-app/infra/logger/jsonLogger"
import { defaultTeardown, type RunMain, type Teardown } from "@effect/platform/Runtime"
import { constantCase } from "change-case"
import { Cause, Effect, Exit, Fiber, Layer } from "effect-app"
import * as ConfigProvider from "effect/ConfigProvider"
import * as Logger from "effect/Logger"
import * as Level from "effect/LogLevel"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"

const makeBasicRuntime = <R, A, E>(layer: Layer<R, A, E>) =>
  Effect.gen(function*() {
    const scope = yield* Scope.make()
    const env = yield* Layer.buildWithScope(layer, scope)
    const runtime = yield* Effect.runtime<A>().pipe(Effect.scoped, Effect.provide(env))

    return {
      runtime,
      clean: Scope.close(scope, Exit.void),
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
  configuredEnv && configuredEnv !== "local-dev"
    ? logJson
    : Logger.replace(Logger.defaultLogger, Logger.withSpanAnnotations(Logger.prettyLogger())),
  Layer.setConfigProvider(envProviderConstantCase)
)

export const basicRuntime = Effect.runSync(makeBasicRuntime(basicLayer))

const reportMainError = <E>(cause: Cause.Cause<E>) =>
  Cause.isInterruptedOnly(cause) ? Effect.void : reportError("Main")(cause)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runMainPlatform: RunMain = dual((args) => Effect.isEffect(args[0]), (effect: Effect.Effect<any, any>, options?: {
  readonly disableErrorReporting?: boolean | undefined
  readonly disablePrettyLogger?: boolean | undefined
  readonly teardown?: Teardown | undefined
}) => {
  const teardown = options?.teardown ?? defaultTeardown
  const keepAlive = setInterval(() => {}, 2 ** 31 - 1)

  const fiber = Effect.runFork(
    options?.disableErrorReporting === true
      ? effect
      : Effect.tapErrorCause(effect, (cause) => {
        if (Cause.isInterruptedOnly(cause)) {
          return Effect.void
        }
        return Effect.logError(cause)
      })
  )

  let signaled = !import.meta.hot

  fiber.addObserver((exit) => {
    clearInterval(keepAlive)
    teardown(exit, (code) => {
      if (signaled) process.exit(code)
    })
  })

  function onSigint() {
    signaled = true
    process.removeListener("SIGINT", onSigint)
    process.removeListener("SIGTERM", onSigint)
    fiber.unsafeInterruptAsFork(fiber.id())
  }

  process.once("SIGINT", onSigint)
  process.once("SIGTERM", onSigint)

  if (import.meta.hot) {
    import.meta.hot.accept(async () => {})
    import.meta.hot.dispose(async () => {
      await basicRuntime.runPromise(Fiber.interrupt(fiber))
    })
  }
})

export function runMain<A, E>(eff: Effect<A, E, never>) {
  return runMainPlatform(
    eff
      .pipe(
        Effect.tapErrorCause(reportMainError),
        Effect.provide(basicLayer)
      ),
    { disablePrettyLogger: true }
  )
}

export type RT = typeof basicRuntime.runtime extends Runtime.Runtime<infer R> ? R : never
