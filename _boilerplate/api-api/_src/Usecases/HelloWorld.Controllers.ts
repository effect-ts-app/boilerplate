import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { User } from "@effect-app-boilerplate/types/User"

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
