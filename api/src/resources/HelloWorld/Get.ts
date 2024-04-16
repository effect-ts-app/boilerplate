import { S } from "resources/lib.js"
import { UserView } from "../Views.js"

export class GetHelloWorldRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetHelloWorldRequest>()({
    echo: S.String
  })
{}

export class Response extends S.Class<Response>()({
  now: S.Date.withDefault,
  echo: S.String,
  context: S.Unknown,
  currentUser: S.NullOr(UserView),
  randomUser: UserView
}) {}
