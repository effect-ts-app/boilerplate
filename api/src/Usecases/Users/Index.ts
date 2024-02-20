import { UserId } from "models/User.js"
import { S } from "resources/lib.js"
import { UserView } from "../../resources/Views/UserView.js"

export class IndexUsersRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<IndexUsersRequest>()({
  filterByIds: S.nonEmptyArray(UserId)
}) {}

export class Response extends S.Class<Response>()({
  users: S.array(UserView)
}) {}
