import { matchFor, Router } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect-app"
import { MeRsc } from "resources.js"

export default Router(MeRsc)({
  dependencies: [UserRepo.Default],
  effect: Effect.gen(function*() {
    const userRepo = yield* UserRepo

    return matchFor(MeRsc)({
      GetMe: userRepo.getCurrentUser
    })
  })
})
