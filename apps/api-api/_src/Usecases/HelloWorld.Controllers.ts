import { HelloWorldRsc } from "@effect-ts-app/boilerplate-demo-client"
import { User } from "@effect-ts-app/boilerplate-demo-types/User"

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
