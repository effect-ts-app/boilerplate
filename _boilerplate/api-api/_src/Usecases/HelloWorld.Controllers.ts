import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"

export const HelloWorldControllers = Effect(
  matchResource(HelloWorldRsc)({
    Get: (_req, { context, user }) =>
      Effect({
        context,
        now: new Date(),
        currentUser: user,
        randomUser: User.Arbitrary.generate.value
      })
  })
)
