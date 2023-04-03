import { OperationsRsc } from "@effect-app-boilerplate/resources"
import { Operations } from "api/services.js"

const operations = matchFor(OperationsRsc)

const Find = operations.matchFind(
  { Operations },
  ({ id }, { operations }) => operations.find(id).map(_ => _.getOrNull)
)

export default operations.controllers({ Find })
