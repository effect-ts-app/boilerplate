import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect"

const helloWorld = matchFor(HelloWorldRsc)

const Get = helloWorld.Get(
  { UserRepo },
  ({ echo }, { Response, context, userRepo }) =>
    userRepo
      .getCurrentUser
      .pipe(
        Effect.catchTags({
          "NotLoggedInError": () => Effect.succeed(null),
          "NotFoundError": () => Effect.succeed(null)
        })
      )
      .andThen((user) =>
        new Response({
          context,
          echo,
          currentUser: user,
          randomUser: User.Arbitrary.generate.value
        })
      )
)

export default helloWorld.controllers({ Get })
