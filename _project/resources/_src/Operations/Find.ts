import { S } from "@effect-app-boilerplate/resources/lib"
import { Operation, OperationId } from "../Views.js"

export class FindOperationRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindOperationRequest>()({
    id: OperationId
  })
{}

export const FindOperationResponse = S.nullable(Operation)
