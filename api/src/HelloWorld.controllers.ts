import { generate } from "@effect-app/infra/test"
import { RpcRouter } from "@effect/rpc"
import { RPC } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect, S } from "effect-app"
import { User } from "models/User.js"
import { GetHelloWorld } from "resources/HelloWorld.js"

export default RpcRouter.make(
  RPC.effect(GetHelloWorld, ({ echo }) =>
    UserRepo
      .tryGetCurrentUser
      .pipe(
        Effect.catchTags({
          "NotLoggedInError": () => Effect.succeed(null),
          "NotFoundError": () => Effect.succeed(null)
        }),
        Effect.andThen((user) =>
          new GetHelloWorld.success({
            context: {}, // TODO: no more
            echo,
            currentUser: user,
            randomUser: generate(S.A.make(User)).value
          })
        )
      ))
)
