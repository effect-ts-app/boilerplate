import { matchFor } from "api/lib/routing.js"
import { Operations } from "api/services.js"
import { Effect } from "effect-app"
import { OperationsRsc } from "resources.js"
import { OperationsDefault } from "./lib/layers.js"

export default matchFor(OperationsRsc)([
  OperationsDefault
], ({ FindOperation }) =>
  Effect.gen(function*() {
    const operations = yield* Operations
    return {
      FindOperation: FindOperation(
        ({ id }) =>
          operations
            .find(id)
            .pipe(Effect.andThen((_) => _.value ?? null))
      )
    }
  }))
