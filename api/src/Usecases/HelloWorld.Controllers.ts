import { generate } from "@effect-app/infra/test.arbs"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { Effect, S } from "effect-app"
import { User } from "models/User.js"
import { HelloWorldRsc } from "resources.js"

const helloWorld = matchFor(HelloWorldRsc)

class Get extends helloWorld.Get(({ echo }, { Response, context }) =>
  UserRepo
    .getCurrentUser
    .pipe(
      Effect.catchTags({
        "NotLoggedInError": () => Effect.succeed(null),
        "NotFoundError": () => Effect.succeed(null)
      }),
      Effect.andThen((user) =>
        new Response({
          context,
          echo,
          currentUser: user,
          randomUser: generate(S.A.make(User)).value
        })
      )
    )
) {}

export default helloWorld.controllers({
  Get
})
