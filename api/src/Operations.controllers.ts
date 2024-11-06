import { matchFor, Router } from "api/lib/routing.js"
import { Operations } from "api/services.js"
import { Effect } from "effect-app"
import { OperationsRsc } from "resources.js"
import { OperationsDefault } from "./lib/layers.js"

export default Router(OperationsRsc)({
  dependencies: [OperationsDefault],
  effect: Effect.gen(function*() {
    const operations = yield* Operations

    return matchFor(OperationsRsc)({
      FindOperation: ({ id }) =>
        operations
          .find(id)
          .pipe(Effect.andThen((_) => _.value ?? null))
    })
  })
})
