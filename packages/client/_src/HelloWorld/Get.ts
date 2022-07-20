import { User } from "@effect-ts-app/boilerplate-types/User"
import { Get, Model } from "@effect-ts-app/schema"

export class GetHelloWorldRequest extends Get("/hello-world")<GetHelloWorldRequest>()({}) {}

export class GetHelloWorldResponse extends Model<GetHelloWorldResponse>()({
  now: prop(date),
  user: prop(User),
  context: prop(unknown)
}) {}
