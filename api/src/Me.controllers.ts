import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect-app"
import { MeRsc } from "resources.js"

export default matchFor(MeRsc)({
  dependencies: [UserRepo.Default],
  effect: Effect.gen(function*() {
    const userRepo = yield* UserRepo

    const { GetMe } = matchFor(MeRsc)
    return {
      GetMe: GetMe(userRepo.getCurrentUser)
    }
  })
})
