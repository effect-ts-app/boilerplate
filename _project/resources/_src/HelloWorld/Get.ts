import { User } from "@effect-app-boilerplate/models/User"

@allowRoles("user")
export class GetHelloWorldRequest
  extends Get("/hello-world", cfg({ allowAnonymous: true }))<GetHelloWorldRequest>()({})
{}

export class GetHelloWorldResponse extends Class<GetHelloWorldResponse>()({
  now: date,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
