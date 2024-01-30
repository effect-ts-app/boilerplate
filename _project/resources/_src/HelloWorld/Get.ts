import { User } from "@effect-app-boilerplate/models/User"

@allowRoles("user")
export class GetHelloWorldRequest extends Req(cfg({ allowAnonymous: true }))<GetHelloWorldRequest>()({
  echo: string
}) {}

export class Response extends Class<Response>()({
  now: S.Date,
  echo: string,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
