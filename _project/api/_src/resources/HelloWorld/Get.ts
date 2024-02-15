import { S } from "@effect-app-boilerplate/api/resources/lib"
import { UserView } from "../Views.js"

export class GetHelloWorldRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetHelloWorldRequest>()({
    echo: S.string
  })
{}

export class Response extends S.Class<Response>()({
  now: S.Date.withDefault,
  echo: S.string,
  context: S.unknown,
  currentUser: S.nullable(UserView),
  randomUser: UserView
}) {}
