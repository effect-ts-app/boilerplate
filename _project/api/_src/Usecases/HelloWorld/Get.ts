import { User } from "@effect-app-boilerplate/models/User"
import { Get, Model } from "@effect-app/schema"
import { match } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"

@allowAnonymous
@allowRoles("user")
export class Request extends Get("/hello-world")<Request>()({}) {}

export class Response extends Model<Response>()({
  now: prop(date),
  context: prop(unknown),
  currentUser: prop(nullable(User)),
  randomUser: prop(User)
}) {}

export default match(
  { Request, Response },
  { UserRepo },
  (_, { context, userRepo }) =>
    userRepo
      .getCurrentUser
      .catchTags({ "NotLoggedInError": () => Effect(null), "NotFoundError": () => Effect(null) })
      .map((user) => ({
        context,
        now: new Date(),
        currentUser: user,
        randomUser: User.Arbitrary.generate.value
      }))
)
