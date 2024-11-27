import { Events } from "#api/services"
import { ClientEvents } from "#resources"
import { makeSSE } from "@effect-app/infra/api/middlewares"
import { Effect } from "effect-app"

export const makeEvents = Effect.gen(function*() {
  const stream = yield* Events.use((_) => _.stream)
  return makeSSE(ClientEvents)(stream)
})
