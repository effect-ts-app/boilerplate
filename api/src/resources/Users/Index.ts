import { UserId } from "models/User"
import { S } from "resources/lib"
import { UserView } from "../Views/UserView"

export class IndexUsersRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<IndexUsersRequest>()({
  filterByIds: S.nonEmptyArray(UserId)
}) {}

export class Response extends S.Class<Response>()({
  users: S.array(UserView)
}) {}
