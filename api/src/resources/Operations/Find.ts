import { Operation, OperationId } from "effect-app/Operations"
import { S } from "resources/lib"

export class FindOperationRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
    id: OperationId
  })
{}

export const FindOperationResponse = S.nullable(Operation)
