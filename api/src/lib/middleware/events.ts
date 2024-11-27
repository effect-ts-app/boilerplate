import { makeSSE } from "@effect-app/infra/api/middlewares"
import { Events } from "#api/services"
import { Effect } from "effect-app"
import { ClientEvents } from "#resources"

export const makeEvents = Effect.gen(function*() {
  const stream = yield* Events.use((_) => _.stream)
  return makeSSE(ClientEvents)(stream)
})
