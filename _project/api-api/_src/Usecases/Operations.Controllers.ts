import { Operations } from "@/services.js"
import { OperationsRsc } from "@effect-app-boilerplate/resources"

export const OperationsControllers = Effect.servicesWith({ Operations }, (
  { Operations }
) =>
  matchResource(OperationsRsc)({
    Find: ({ id }) => Operations.find(id).map(_ => _.getOrNull)
  }))
