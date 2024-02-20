import { matchFor } from "api/lib/matchFor"
import { Operations } from "api/services"
import { OperationsRsc } from "resources"

const operations = matchFor(OperationsRsc)

export default operations.controllers({
  Find: operations.Find(({ id }) =>
    Operations
      .find(id)
      .andThen((_) => _.value ?? null)
  )
})
