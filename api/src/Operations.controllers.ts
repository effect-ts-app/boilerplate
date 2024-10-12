import { matchFor } from "api/lib/routing.js"
import { Operations } from "api/services.js"
import { Effect, Option } from "effect-app"
import { OperationsRsc } from "resources.js"
import { OperationsLive } from "./lib/layers.js"

const operations = matchFor(OperationsRsc)

export default operations.controllers({
  FindOperation: class extends operations.FindOperation(({ id }) =>
    Effect.andThen(
      Operations.find(id),
      Option.getOrNull
    )
  ) {}
}, [OperationsLive])
