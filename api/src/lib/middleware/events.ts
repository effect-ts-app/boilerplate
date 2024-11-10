import { makeSSE } from "@effect-app/infra/api/middlewares"
import { Events } from "api/services.js"
import { Effect, Stream } from "effect-app"
import { ClientEvents } from "resources.js"

export const makeEvents = Events.pipe(
  Effect.map((events) => makeSSE(Stream.unwrapScoped(events.stream), ClientEvents))
)
