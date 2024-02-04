import { S } from "@effect-app/prelude"
import { Req } from "../lib.js"
import { Operation, OperationId } from "../Views.js"

export class FindOperationRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
  id: OperationId
}) {}

export const FindOperationResponse = S.nullable(Operation)
