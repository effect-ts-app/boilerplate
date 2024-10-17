import { RequestContextContainer } from "@effect-app/infra/services/RequestContextContainer"
import { generate } from "@effect-app/infra/test"
import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect, S } from "effect-app"
import { User } from "models/User.js"
import { HelloWorldRsc } from "resources.js"

const router = matchFor(HelloWorldRsc)

export default router.effect(
  [RequestContextContainer.live, UserRepo.Default],
  Effect.gen(function*() {
    const rcc = yield* RequestContextContainer
    const userRepo = yield* UserRepo

    return {
      GetHelloWorld: class extends router.GetHelloWorld(({ echo }, { Response }) =>
        Effect.gen(function*() {
          const context = yield* rcc.requestContext
          return yield* userRepo
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
        })
      ) {}
    }
  })
)
