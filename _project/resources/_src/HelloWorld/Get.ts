import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app-boilerplate/resources/lib"

export class GetHelloWorldRequest
  extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetHelloWorldRequest>()({
    echo: S.string
  })
{}

export class Response extends S.Class<Response>()({
  now: S.Date.withDefault,
  echo: S.string,
  context: S.unknown,
  currentUser: S.nullable(User),
  randomUser: User
}) {}
