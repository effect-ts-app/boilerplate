import { User } from "@effect-app-boilerplate/models/User"
import { Get, Model } from "@effect-app/schema"

@allowAnonymous
@allowRoles("user")
export class GetHelloWorldRequest extends Get("/hello-world")<GetHelloWorldRequest>()({}) {}

export class GetHelloWorldResponse extends Model<GetHelloWorldResponse>()({
  now: date,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
