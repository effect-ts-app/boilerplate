import { HelloWorldRsc } from "@effect-ts-app/boilerplate-client"
import { User } from "@effect-ts-app/boilerplate-types/User"

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
