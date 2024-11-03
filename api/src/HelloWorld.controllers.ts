import { getRequestContext } from "@effect-app/infra/api/setupRequest"
import { generate } from "@effect-app/infra/test"
import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect, S } from "effect-app"
import { User } from "models/User.js"
import { HelloWorldRsc } from "resources.js"

export default matchFor(HelloWorldRsc)({
  dependencies: [UserRepo.Default],
  effect: Effect.gen(function*() {
    const userRepo = yield* UserRepo

    const { GetHelloWorld } = matchFor(HelloWorldRsc)
    return {
      GetHelloWorld: GetHelloWorld(({ echo }) =>
        Effect.gen(function*() {
          const context = yield* getRequestContext
          return yield* userRepo
            .tryGetCurrentUser
            .pipe(
              Effect.catchTags({
                "NotLoggedInError": () => Effect.succeed(null),
                "NotFoundError": () => Effect.succeed(null)
              }),
              Effect.andThen((user) =>
                new GetHelloWorld.success({
                  context,
                  echo,
                  currentUser: user,
                  randomUser: generate(S.A.make(User)).value
                })
              )
            )
        })
      )
    }
  })
})
