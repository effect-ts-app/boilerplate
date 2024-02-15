import { OperationsRsc } from "@effect-app-boilerplate/api/resources"
import { matchFor } from "api/lib/matchFor.js"
import { Operations } from "api/services.js"

const operations = matchFor(OperationsRsc)

export default operations.controllers({
  Find: operations.Find(({ id }) =>
    Operations
      .find(id)
      .andThen((_) => _.value ?? null)
  )
})
