import { UserId } from "@effect-app-boilerplate/models/User"
import { array, Class, nonEmptyArray } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"
import { UserView } from "../Views/UserView.js"

export class IndexUsersRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<IndexUsersRequest>()({
  filterByIds: nonEmptyArray(UserId)
}) {}

export class Response extends Class<Response>()({
  users: array(UserView)
}) {}
