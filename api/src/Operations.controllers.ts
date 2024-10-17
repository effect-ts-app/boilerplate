import { matchFor } from "api/lib/routing.js"
import { Operations } from "api/services.js"
import { Effect } from "effect-app"
import { OperationsRsc } from "resources.js"
import { OperationsDefault } from "./lib/layers.js"

const router = matchFor(OperationsRsc)

export default router.effect(
  [OperationsDefault],
  Effect.gen(function*() {
    const operations = yield* Operations
    return {
      FindOperation: router.FindOperation(
        ({ id }) =>
          operations
            .find(id)
            .pipe(Effect.andThen((_) => _.value ?? null))
      )
    }
  })
)
