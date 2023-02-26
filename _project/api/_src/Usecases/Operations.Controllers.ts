import { OperationsRsc } from "@effect-app-boilerplate/resources"
import { Operations } from "api//services.js"

const { controllers, matchWithServices } = matchFor(OperationsRsc)

const Find = matchWithServices("Find")(
  { Operations },
  ({ id }, { operations }) => operations.find(id).map(_ => _.getOrNull)
)

export const OperationsControllers = controllers({ Find })
