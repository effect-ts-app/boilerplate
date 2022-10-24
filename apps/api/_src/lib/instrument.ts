import { StopWatch } from "stopwatch-node"
import { logger } from "./logger.js"

export function instrument(name: string, properties?: Record<string, string>) {
  return Effect.acquireRelease(
    Effect.sync(() => {
      const sw = new StopWatch()
      sw.start(name)
      return {
        sw
      }
    }),
    ({ sw }) => {
      sw.stop()
      // TODO
      return logger.info(`$ Instrumented ${[name, sw.getTotalTime(), properties]}`) // trackMetric(name, sw.getTotalTime(), properties)
    }
  )
}

// const InstrumentTag = Tag<Effect.Success<ReturnType<typeof instrument>>>()

// export function Instrument(name: string, properties?: Record<string, string>) {
//   return Layer.scoped(InstrumentTag, instrument(name, properties))
// }

/**
 * @tsplus fluent effect/core/io/Effect instrument
 */
export function instr<R, E, A>(self: Effect<R, E, A>, name: string, properties?: Record<string, string>) {
  return instrument(name, properties).scope(self)
}
