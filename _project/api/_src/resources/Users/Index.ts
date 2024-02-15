import { UserId } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app-boilerplate/resources/lib"
import { UserView } from "../Views/UserView.js"

export class IndexUsersRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<IndexUsersRequest>()({
  filterByIds: S.nonEmptyArray(UserId)
}) {}

export class Response extends S.Class<Response>()({
  users: S.array(UserView)
}) {}
