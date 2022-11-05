import { Get, Model } from "@effect-ts-app/schema"
import { User } from "@effect-ts-app/boilerplate-types/User"

@allowAnonymous
export class GetHelloWorldRequest extends Get("/hello-world")<GetHelloWorldRequest>()({}) {}

export class GetHelloWorldResponse extends Model<GetHelloWorldResponse>()({
  now: prop(date),
  context: prop(unknown),
  currentUser: prop(nullable(User)),
  randomUser: prop(User)
}) {}
