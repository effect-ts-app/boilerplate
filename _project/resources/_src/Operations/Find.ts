import { Req } from "@effect-app/prelude/schema"
import { nullable } from "@effect-app/schema"
import { Operation, OperationId } from "../Views.js"

@allowRoles("user")
export class FindOperationRequest extends Req()<FindOperationRequest>()({
  id: OperationId
}) {}

export const FindOperationResponse = nullable(Operation)
