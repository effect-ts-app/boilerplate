import { generate } from "@effect-app/infra/test"
import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect, S } from "effect-app"
import { User } from "models/User.js"
import { HelloWorldRsc } from "resources.js"

const helloWorld = matchFor(HelloWorldRsc)

export default helloWorld.controllers({
  GetHelloWorld: class extends helloWorld.GetHelloWorld(({ echo }, { Response, context }) =>
    UserRepo
      .tryGetCurrentUser
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
})
