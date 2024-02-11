import { OperationsRsc } from "@effect-app-boilerplate/resources"
import { matchFor } from "api/lib/matchFor.js"
import { Operations } from "api/services.js"

const operations = matchFor(OperationsRsc)

const Find = operations.Find(
  ({ id }) =>
    Operations
      .find(id)
      .andThen((_) => _.value ?? null)
)

export default operations.controllers({ Find })
