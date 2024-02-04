import { Req } from "@effect-app/prelude/schema"
import { nullable } from "@effect-app/schema"
import { Operation, OperationId } from "../Views.js"

export class FindOperationRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
  id: OperationId
}) {}

export const FindOperationResponse = nullable(Operation)
