import { matchFor } from "api/lib/matchFor.js"
import { Operations } from "api/services.js"
import { Effect, Option } from "effect-app"
import { OperationsRsc } from "resources.js"

const operations = matchFor(OperationsRsc)

export default operations.controllers({
  FindOperation: class extends operations.FindOperation(({ id }) =>
    Effect.andThen(
      Operations.find(id),
      Option.getOrNull
    )
  ) {}
})
