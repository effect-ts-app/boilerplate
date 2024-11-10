import { makeSSE } from "@effect-app/infra/api/middlewares"
import { Events } from "api/services.js"
import { Effect } from "effect-app"
import { ClientEvents } from "resources.js"

export const makeEvents = Effect.gen(function*() {
  const stream = yield* Events.use((_) => _.stream)
  return makeSSE(ClientEvents)(stream)
})
