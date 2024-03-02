import { matchFor } from "api/lib/matchFor.js"
import { Operations } from "api/services.js"
import { Effect, Option } from "effect-app"
import { OperationsRsc } from "resources.js"

const operations = matchFor(OperationsRsc)

export default operations.controllers({
  Find: operations.Find(({ id }) =>
    Effect.andThen(
      Operations.find(id),
      Option.getOrNull
    )
  )
})
