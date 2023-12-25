import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/schema"

@allowRoles("user")
@useClassFeaturesForSchema
export class GetHelloWorldRequest
  extends Get("/hello-world", cfg({ allowAnonymous: true }))<GetHelloWorldRequest>()({})
{}

export class GetHelloWorldResponse extends Class<GetHelloWorldResponse>()({
  now: S.Date,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
