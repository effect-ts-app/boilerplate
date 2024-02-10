import { S } from "@effect-app-boilerplate/resources/lib"
import { Operation, OperationId } from "effect-app/Operations"

export class FindOperationRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
    id: OperationId
  })
{}

export const FindOperationResponse = S.nullable(Operation)
