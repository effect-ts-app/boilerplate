import { nullable } from "@effect-app/schema"
import { Operation, OperationId } from "../Views.js"

@allowRoles("user")
export class FindOperationRequest extends Get()<FindOperationRequest>()({
  id: OperationId
}) {}

export const FindOperationResponse = nullable(Operation)
