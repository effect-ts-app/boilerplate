import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/schema"

@allowRoles("user")
export class GetHelloWorldRequest extends Post(cfg({ allowAnonymous: true }))<GetHelloWorldRequest>()({
  echo: S.string
}) {}

export class Response extends Class<Response>()({
  now: S.Date,
  echo: S.string,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
