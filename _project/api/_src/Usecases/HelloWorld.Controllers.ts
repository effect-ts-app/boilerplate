import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { UserRepo } from "api/services.js"

const helloWorld = matchFor(HelloWorldRsc)

const Get = helloWorld.Get(
  { UserRepo },
  ({ echo }, { Response, context, userRepo }) =>
    userRepo
      .getCurrentUser
      .catchTags({ "NotLoggedInError": () => Effect.succeed(null), "NotFoundError": () => Effect.succeed(null) })
      .map((user) =>
        new Response({
          context,
          echo,
          now: new Date(),
          currentUser: user,
          randomUser: User.Arbitrary.generate.value
        })
      )
)

export default helloWorld.controllers({ Get })
