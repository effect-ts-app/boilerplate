import { UserId } from "@effect-app-boilerplate/models/User"
import { UserView } from "../Views/UserView.js"

@allowRoles("user")
export class IndexUsersRequest extends Req(cfg({ allowAnonymous: true }))<IndexUsersRequest>()({
  filterByIds: nonEmptyArray(UserId)
}) {}

export class Response extends Class<Response>()({
  users: array(UserView)
}) {}
