import { defaultTeardown } from "@effect-app/infra-adapters/runMain"
import * as ConfigProvider from "@effect/io/Config/Provider"
import { currentServices } from "@effect/io/DefaultServices"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Logger from "@effect/io/Logger"
import * as Level from "@effect/io/Logger/Level"
import * as Context from "@fp-ts/data/Context"
import { camelCase, constantCase } from "change-case"

const makeBasicRuntime = <R, E, A>(layer: Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(layer.buildWithScope(scope))
    const runtime = yield* $(
      pipe(Effect.runtime<A>(), Effect.scoped, Effect.provideContext(env))
    )

    return {
      runtime,
      clean: scope.close(Exit.unit)
    }
  })

const provider = ConfigProvider.fromEnv({
  pathDelim: "_", // i'd prefer "__"
  seqDelim: ",",
  conversion: constantCase,
  reverseConversion: camelCase
})

export const basicRuntime = Runtime.defaultRuntime.unsafeRunSync(
  makeBasicRuntime(
    Logger.minimumLogLevel(Level.Debug)
      > Logger.logFmt
      > currentServices.update(Context.add(ConfigProvider.Tag)(provider))
        .toLayerDiscard
  )
)

/**
 * @tsplus getter effect/io/Effect unsafeRunSync$
 */
export const unsafeRunSync = basicRuntime.runtime.unsafeRunSync

/**
 * @tsplus getter effect/io/Effect unsafeRunPromise$
 */
export const unsafeRunPromise = basicRuntime.runtime.unsafeRunPromise

/**
 * @tsplus getter effect/io/Effect unsafeRunPromiseExit$
 */
export const unsafeRunPromiseExit = basicRuntime.runtime.unsafeRunPromiseExit

/**
 * @tsplus fluent effect/io/Effect unsafeRun$
 */
export const unsafeRun = basicRuntime.runtime.unsafeRun

/**
 * A dumbed down version of effect-ts/node's runtime, in preparation of new effect-ts
 * @tsplus fluent effect/io/Effect runMain$
 */
export function runMain<E, A>(eff: Effect.Effect<never, E, A>) {
  const onExit = (s: number) => {
    process.exit(s)
  }

  unsafeRun(
    Fiber.fromEffect(eff)
      .map(context => {
        unsafeRun(
          context.await()
            .flatMap(exit =>
              Effect.gen(function*($) {
                if (exit.isFailure()) {
                  if (exit.cause.isInterruptedOnly()) {
                    yield* $(Effect.logWarning("Main process Interrupted"))
                    defaultTeardown(0, context.id(), onExit)
                    return
                  } else {
                    yield* $(Effect.logErrorCauseMessage("Main process Error", exit.cause))
                    defaultTeardown(1, context.id(), onExit)
                    return
                  }
                } else {
                  defaultTeardown(0, context.id(), onExit)
                }
              })
            )
        )

        function handler() {
          process.removeListener("SIGTERM", handler)
          process.removeListener("SIGINT", handler)
          context.interruptAsFork(context.id()).unsafeRun()
        }
        process.once("SIGTERM", handler)
        process.once("SIGINT", handler)
      })
  )
}
