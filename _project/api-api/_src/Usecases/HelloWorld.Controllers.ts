import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"

const { controllers, matchWith } = matchFor(HelloWorldRsc)

const Get = matchWith("Get")(
  (_req, { context, user }) =>
    Effect({
      context,
      now: new Date(),
      currentUser: user,
      randomUser: User.Arbitrary.generate.value
    })
)

export const HelloWorldControllers = controllers(Effect.struct({ Get }))
