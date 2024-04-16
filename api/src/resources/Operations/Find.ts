import { Operation, OperationId } from "effect-app/Operations"
import { S } from "resources/lib.js"

export class FindOperationRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
    id: OperationId
  })
{}

export const FindOperationResponse = S.NullOr(Operation)
