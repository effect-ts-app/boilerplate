import { StopWatch } from "stopwatch-node"

export function instrument(name: string, properties?: Record<string, string>) {
  return Managed.make_(
    Effect.succeedWith(() => {
      const sw = new StopWatch()
      sw.start(name)
      return {
        sw
      }
    }),
    ({ sw }) => {
      sw.stop()
      // TODO
      return Effect.succeedWith(() => console.debug("$ Instrumented", name, sw.getTotalTime(), properties)) // trackMetric(name, sw.getTotalTime(), properties)
    }
  )
}

export function Instrument(name: string, properties?: Record<string, string>) {
  return Layer.fromRawManaged(instrument(name, properties))
}
