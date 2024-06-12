import { UserId } from "models/User.js"
import { S } from "resources/lib.js"
import { UserView } from "../Views/UserView.js"

export class IndexUsersRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<IndexUsersRequest>()({
  filterByIds: S.NonEmptyArray(UserId)
}) {}

export class Response extends S.Class<Response>()({
  users: S.Array(UserView)
}) {}
